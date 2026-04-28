/** Popup: `get video info` on tab → {@link MediaInfo}; downloads → background (TikTok CDN → main-world blob). */

import type { M3u8AddDownloadType, M3u8Mp3AddDownloadType } from '../types';

import type { Download, MediaInfo, PopupModule } from '@/system/types';
import { downloadResolutionShortSide } from '@/core/common/download-quality-tier';
import { options, runtimeMessageInstance } from '@/core/common/globals';
import { getActiveTab, urlMatchesTikTok } from '@/core/common/helpers';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import { downloadFile } from '../common/functions';

async function mediaInfoFromTab(tabId: number, url: string): Promise<MediaInfo> {
    const response = await runtimeMessageInstance('popup').send<{ url: string }, { info: MediaInfo }>(
        CONTENT_MESSAGE_PAGE,
        'get video info',
        { url },
        tabId,
    );

    if (response.error) {
        throw new Error(response.message);
    }
    return response.data.info;
}

function pickLowestQualityDownload(downloads: Download[]): Download | undefined {
    if (downloads.length === 0) {
        return undefined;
    }
    return downloads.reduce((prev, curr) => {
        const prevQ = downloadResolutionShortSide(prev);
        const currQ = downloadResolutionShortSide(curr);
        return currQ < prevQ ? curr : prev;
    });
}

const popupModule = {
    urlMatches(url) {
        return urlMatchesTikTok(url);
    },

    async getInfo(url, tabId, _tab) {
        if (typeof tabId !== 'number') {
            throw new TypeError('No tab id. Keep the TikTok tab focused and try again.');
        }

        return mediaInfoFromTab(tabId, url);
    },

    async downloadItem(download, _info) {
        await options.Ready;
        const title = download.title ?? 'video';

        if (download.format === 'm3u8') {
            const data: M3u8AddDownloadType = {
                url: download.url,
                title,
                quality: download.quality,
                qualityLabel: download.videoQuality?.label,
            };
            const activeTab = await getActiveTab();
            if (typeof activeTab?.id !== 'number') {
                throw new TypeError('No active tab. Keep the TikTok tab focused and try again.');
            }
            await runtimeMessageInstance('popup').send(CONTENT_MESSAGE_PAGE, 'add m3u8 download', data, activeTab.id);
            return;
        }

        const activeTab = await getActiveTab();
        if (typeof activeTab?.id !== 'number') {
            throw new TypeError('No active tab. Keep the TikTok tab focused and try again.');
        }

        await downloadFile('popup', download.url, {
            title,
            quality: download.quality,
            extension: download.format,
        }, activeTab.id);
    },

    async convertToMp3(bitrate, startTime, endTime, info) {
        if (!info || info.type !== 'single') {
            throw new Error('MP3 conversion is only available for a single video page.');
        }

        const candidates = info.downloads.filter(
            d =>
                d.type === 'AudioVideo'
                && (d.format === 'mp4' || d.format === 'm3u8'),
        );
        const download = pickLowestQualityDownload(candidates);

        if (!download) {
            throw new Error('No suitable MP4 or HLS stream found for MP3 conversion.');
        }

        await options.Ready;

        const { length } = info;
        const title = download.title ?? 'video';

        const data: M3u8Mp3AddDownloadType = {
            url: download.url,
            title,
            bitrate,
            length,
            startTime,
            endTime,
        };

        const activeTab = await getActiveTab();
        if (typeof activeTab?.id !== 'number') {
            throw new TypeError('No active tab. Keep the TikTok tab focused and try again.');
        }

        await runtimeMessageInstance('popup').send(CONTENT_MESSAGE_PAGE, 'add m3u8 mp3 download', data, activeTab.id);
    },

    async downloadThumbnail(thumbnail, info) {
        if (!info || info.type !== 'single') {
            throw new Error('Thumbnails are only available for a single video page.');
        }

        const filename = `${info.title} thumbnail [${thumbnail.label}].jpg`;

        const activeTab = await getActiveTab();
        if (typeof activeTab?.id !== 'number') {
            throw new TypeError('No active tab. Keep the TikTok tab focused and try again.');
        }

        await downloadFile('popup', thumbnail.url, { filename }, activeTab.id);
    },
} satisfies PopupModule;

export { popupModule };
