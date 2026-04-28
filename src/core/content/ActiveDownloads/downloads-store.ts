import type { ActiveDownload, M3u8AddDownloadType, M3u8Mp3AddDownloadType } from '@/core/types';

import FFmpegHelper from '@addoncrop/ffmpeg-helper';
import M3u8Downloader from '@addoncrop/m3u8-downloader';

import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import { downloadFile } from '@/core/common/functions';
import { runtimeMessageInstance } from '@/core/common/globals';
import { isTikTokMediaDownloadSourceUrl } from '@/core/common/tiktok-cdn-url';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import { fetchTikTokMediaArrayBufferInPage } from '@/core/content/tiktok-content-bridge';

const m3u8Downloader = new M3u8Downloader({
    concurrency: 8,
    retries: 3,
});

const abortIds: Record<string, number> = {};
const fetchAbortControllers: Record<string, AbortController> = {};
const ffmpegAbortControllers: Record<string, { abort: () => void }> = {};

const RE_M3U8_EXT = /\.m3u8(?:\?|$)/i;
const RE_HLS_PATH = /\/hls\//i;

function isM3u8Url(url: string): boolean {
    return RE_M3U8_EXT.test(url) || RE_HLS_PATH.test(url);
}

/**
 * Progressive URL (e.g. direct MP4): fetch into memory with progress.
 * HLS uses {@link m3u8Downloader} instead.
 */
async function downloadMediaBuffer(
    url: string,
    uuid: string,
    updateStatus: (u: string, s: ActiveDownload['status']) => void,
): Promise<ArrayBuffer> {
    if (isM3u8Url(url)) {
        try {
            return await m3u8Downloader.downloadBuffer(url, {
                uriIdentityParam: '__rvd_m3u8_download',
                onStart(abortId) {
                    abortIds[uuid] = abortId;
                    updateStatus(uuid, {
                        state: 'active',
                        type: 'downloading',
                        progress: 0,
                    });
                },
                onProgress(progress) {
                    updateStatus(uuid, {
                        state: 'active',
                        type: 'downloading',
                        progress,
                    });
                },
            });
        }
        finally {
            delete abortIds[uuid];
        }
    }

    if (isTikTokMediaDownloadSourceUrl(url)) {
        const controller = new AbortController();
        fetchAbortControllers[uuid] = controller;

        updateStatus(uuid, {
            state: 'active',
            type: 'downloading',
            progress: 0,
        });

        try {
            const buf = await fetchTikTokMediaArrayBufferInPage(url, { signal: controller.signal });
            updateStatus(uuid, {
                state: 'active',
                type: 'downloading',
                progress: 1,
            });
            return buf;
        }
        finally {
            delete fetchAbortControllers[uuid];
        }
    }

    const controller = new AbortController();
    fetchAbortControllers[uuid] = controller;

    updateStatus(uuid, {
        state: 'active',
        type: 'downloading',
        progress: 0,
    });

    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok)
            throw new Error(`Download failed: HTTP ${res.status}`);

        const len = Number(res.headers.get('Content-Length')) || 0;
        const reader = res.body?.getReader();
        if (!reader)
            throw new Error('No response body');

        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            if (value) {
                chunks.push(value);
                received += value.length;
                if (len > 0) {
                    updateStatus(uuid, {
                        state: 'active',
                        type: 'downloading',
                        progress: received / len,
                    });
                }
            }
        }

        const total = chunks.reduce((s, c) => s + c.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
            out.set(c, offset);
            offset += c.length;
        }

        return out.buffer;
    }
    finally {
        delete fetchAbortControllers[uuid];
    }
}

interface DownloadsState {
    downloads: ActiveDownload[];

    init: () => void;

    /** Main-world TikTok blob save: show row until main world reports done. */
    beginTikTokBlobDownload: (baseName: string) => string;

    addM3u8Download: (url: string, title: string, quality: string, qualityLabel?: string) => void;

    addM3u8Mp3Download: (url: string, title: string, length: number, bitrate: string, startTime: number | null, endTime: number | null) => void;

    updateStatus: (uuid: string, status: ActiveDownload['status']) => void;

    cancelDownload: (uuid: string) => void;

    openDownloadsFolder: () => void;
}

const useDownloadsStore = create<DownloadsState>((set, get) => ({
    downloads: [],

    beginTikTokBlobDownload(baseName) {
        const uuid = uuidv4();
        const extMatch = /\.([^.]+)$/.exec(baseName);
        const format = extMatch?.[1]?.toLowerCase() === 'mp3' ? 'mp3' : 'mp4';
        const title = baseName.replace(/\.[^.]+$/, '').trim() || 'Video';
        const download: ActiveDownload = {
            type: 'tiktok-blob',
            uuid,
            title,
            format,
            quality: 'Direct',
            status: { state: 'active', type: 'downloading', progress: 0 },
        };

        set(state => ({ downloads: [...state.downloads, download] }));

        return uuid;
    },

    init() {
        const runtimeMessage = runtimeMessageInstance(CONTENT_MESSAGE_PAGE);

        runtimeMessage.on<M3u8AddDownloadType>(
            'add m3u8 download',
            ({ url, title, quality, qualityLabel }) => {
                get().addM3u8Download(url, title, quality, qualityLabel);
            },
        );

        runtimeMessage.on<M3u8Mp3AddDownloadType>(
            'add m3u8 mp3 download',
            ({ url, title, length, bitrate, startTime, endTime }) => {
                get().addM3u8Mp3Download(url, title, length, bitrate, startTime, endTime);
            },
        );
    },

    async addM3u8Download(url, title, quality, qualityLabel) {
        const uuid = uuidv4();
        const download: ActiveDownload = {
            type: 'm3u8',
            title: title ?? document.title,
            uuid,
            format: 'mp4',
            quality: quality ?? '-',
            label: qualityLabel?.toUpperCase(),
            status: { state: 'queued' },
        };

        set(state => ({ downloads: [...state.downloads, download] }));

        const { updateStatus } = get();
        let data: ArrayBuffer;

        try {
            data = await downloadMediaBuffer(url, uuid, updateStatus);
        }
        catch (error) {
            console.error('Download failed', { error });
            updateStatus(uuid, { state: 'failed', message: (error as Error).message });
            return;
        }

        const blob = new Blob([data], { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(blob);

        await downloadFile(CONTENT_MESSAGE_PAGE, downloadUrl, {
            title,
            quality,
            extension: 'mp4',
        });

        URL.revokeObjectURL(downloadUrl);
        updateStatus(uuid, { state: 'complete' });
    },

    async addM3u8Mp3Download(url, title, length, bitrate, startTime, endTime) {
        const uuid = uuidv4();
        const download: ActiveDownload = {
            type: 'm3u8',
            title: title ?? document.title,
            uuid,
            format: 'mp3',
            quality: `${bitrate}kbps`,
            status: { state: 'queued' },
        };

        set(state => ({ downloads: [...state.downloads, download] }));

        const { updateStatus } = get();
        let audioBuffer: ArrayBuffer;

        try {
            audioBuffer = await downloadMediaBuffer(url, uuid, updateStatus);
        }
        catch (error) {
            console.error('Download failed', { error });
            updateStatus(uuid, { state: 'failed', message: (error as Error).message });
            return;
        }

        updateStatus(uuid, { state: 'active', type: 'processing' });

        const ffmpeg = new FFmpegHelper('https://helper.addoncrop.com/', 'error');

        let outputBuffer: ArrayBuffer;

        try {
            await ffmpeg.Ready;
        }
        catch (error) {
            console.error('Error initializing FFmpeg for mp3 download', error);
            updateStatus(uuid, { state: 'failed', message: String(error) });
            return;
        }

        let trim: { from: number; to: number } | undefined;

        if (startTime !== null || endTime !== null) {
            if (startTime !== null && endTime !== null) {
                trim = { from: startTime, to: endTime };
            }
            else if (startTime !== null) {
                trim = { from: startTime, to: length };
            }
            else if (endTime !== null) {
                trim = { from: 0, to: endTime };
            }
        }

        try {
            ({ outputBuffer } = await ffmpeg.run('convert-to-mp3', {
                data: {
                    audioBuffer,
                    bitrate: Number(bitrate) as 128 | 192 | 256 | 320,
                    trim,
                },
                transfer: [audioBuffer],
                onStart(abort) {
                    ffmpegAbortControllers[uuid] = { abort };
                },
                onProgress(progress) {
                    const percentage = Math.ceil(progress * 100);
                    updateStatus(uuid, {
                        state: 'active',
                        type: 'processing',
                        progress: percentage,
                    });
                },
            }));
            delete ffmpegAbortControllers[uuid];
        }
        catch (error) {
            if (typeof ffmpegAbortControllers[uuid] !== 'undefined') {
                delete ffmpegAbortControllers[uuid];
                return;
            }

            console.error('Error converting to mp3 with FFmpeg', error);
            updateStatus(uuid, { state: 'failed', message: String(error) });
            return;
        }

        const blob = new Blob([outputBuffer], { type: 'audio/mp3' });
        const blobUrl = URL.createObjectURL(blob);

        await downloadFile(CONTENT_MESSAGE_PAGE, blobUrl, {
            title,
            quality: `${bitrate}kbps`,
            extension: 'mp3',
        });

        URL.revokeObjectURL(blobUrl);
        updateStatus(uuid, { state: 'complete' });
    },

    updateStatus(uuid, status) {
        set(produce((state: DownloadsState) => {
            const index = state.downloads.findIndex(d => d.uuid === uuid);
            if (index !== -1)
                state.downloads[index] = { ...state.downloads[index]!, status };
        }));
    },

    openDownloadsFolder() {
        runtimeMessageInstance(CONTENT_MESSAGE_PAGE).send('background', 'open downloads folder');
    },

    async cancelDownload(uuid) {
        const { downloads, updateStatus } = get();
        const download = downloads.find(d => d.uuid === uuid);
        if (!download)
            return;

        if (download.type === 'tiktok-blob') {
            updateStatus(uuid, { state: 'canceled' });
            return;
        }

        const abortId = abortIds[uuid];
        if (typeof abortId === 'number')
            await m3u8Downloader.cancel(abortId);

        const fac = fetchAbortControllers[uuid];
        if (fac) {
            fac.abort();
            delete fetchAbortControllers[uuid];
        }

        const ffmpegAbort = ffmpegAbortControllers[uuid];
        if (ffmpegAbort) {
            ffmpegAbort.abort();
            delete ffmpegAbortControllers[uuid];
        }

        updateStatus(uuid, { state: 'canceled' });
    },
}));

export default useDownloadsStore;
