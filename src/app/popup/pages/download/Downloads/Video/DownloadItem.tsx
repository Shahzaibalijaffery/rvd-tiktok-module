import type { Download } from '@/system/types';

import { Download as DownloadIcon } from 'lucide-react';

import { useEffect, useState } from 'react';
import { QualityBadge } from '@/app/components/ui/badge';
import VideoDownloadAction from '@/app/components/VideoDownloadAction';
import { useVideoStore } from '@/app/popup/video-store';
import {
    downloadQualityCaption,
    qualityBadgeText,
    qualityLabelFromDownload,
} from '@/core/common/download-quality-tier';
import { formatBytes } from '@/core/common/helpers';
import { isTikTokMediaDownloadSourceUrl } from '@/core/common/tiktok-cdn-url';
import { cn, getFileSize } from '@/system/lib/utils';

interface Props {
    viewMode: 'list' | 'grid';
    download: Download;
}

/** Full label for visible row + native `title` (hover shows complete text when truncated). */
function downloadItemLabel(download: Download): string {
    const t = download.title?.trim();
    if (t)
        return t;

    const parts = [downloadQualityCaption(download), download.format].filter(Boolean);
    if (parts.length > 0)
        return parts.join(' · ');

    return download.url;
}

export default function DownloadItem({ viewMode, download }: Props) {
    const downloadVideo = useVideoStore(state => state.downloadVideo);

    const primaryLabel = downloadItemLabel(download);
    const captionLine = downloadQualityCaption(download);
    const tier = qualityLabelFromDownload(download);
    const badgeText = qualityBadgeText(tier);

    const [fileSize, setFileSize] = useState<string | null>(() =>
        typeof download.filesize === 'number' && download.filesize > 0
            ? formatBytes(download.filesize)
            : null,
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (fileSize !== null) {
            return;
        }

        if (download.format === 'm3u8') {
            setFileSize('—');
            return;
        }

        const url = download.url;

        if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
            setFileSize('—');
            return;
        }

        /** Popup `HEAD` cannot use page cookies; TikTok CDNs usually 403 / CORS here. */
        if (isTikTokMediaDownloadSourceUrl(url)) {
            setFileSize('—');
            return;
        }

        getFileSize(url)
            .then((size) => {
                setFileSize(size ? formatBytes(size) : '—');
            })
            .catch((error: unknown) => {
                const msg
                    = error instanceof Error ? error.message : String(error);
                console.warn(
                    `Failed to get file size for ${url.slice(0, 80)}…`,
                    msg,
                );
                setFileSize('—');
            });
    }, [download.format, download.url, fileSize]);

    async function onDownloadClick() {
        setLoading(true);
        try {
            await downloadVideo(download);

            if (download.format !== 'm3u8') {
                setTimeout(setLoading, 1000, false);
            }
        }
        finally {
            setLoading(false);
        }
    }

    const titleLine = (
        <p
            title={primaryLabel}
            className="text-text-primary min-h-[1.25rem] truncate text-left text-sm font-semibold leading-snug"
        >
            {primaryLabel}
        </p>
    );

    return (
        <>
            {viewMode === 'list'
                ? (
                        <div
                            className={cn(
                                'group relative flex min-w-0 gap-3 rounded-xl border border-transparent bg-tab-bg p-3 transition-all hover:border-card-border hover:bg-secondary/60 sm:flex-row sm:items-center',
                                tier === 'sd'
                                && 'border-warning bg-warning/10 hover:border-warning hover:bg-warning/20',
                            )}
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                {titleLine}
                                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-xs font-bold uppercase shrink-0">
                                        {download.format}
                                    </span>
                                    <span className="text-text-secondary shrink-0 text-sm font-medium">
                                        {captionLine}
                                    </span>
                                    <QualityBadge
                                        className="uppercase"
                                        text={badgeText}
                                    />
                                    <span className="text-text-secondary shrink-0 text-sm">
                                        {fileSize ?? 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex shrink-0 justify-end sm:justify-start">
                                <VideoDownloadAction
                                    Icon={DownloadIcon}
                                    title="Download"
                                    selected
                                    loading={loading}
                                    onClick={onDownloadClick}
                                />
                            </div>
                        </div>
                    )
                : (
                        <div
                            className={cn(
                                'group relative flex min-w-0 flex-col gap-2 rounded-xl border border-transparent bg-tab-bg p-3 transition-all hover:border-card-border hover:bg-secondary/60 sm:min-w-[179px]',
                                tier === 'sd'
                                && 'border-warning bg-warning/10 hover:border-warning hover:bg-warning/20',
                            )}
                        >
                            {titleLine}
                            <div className="flex items-center justify-between gap-2">
                                <span className="w-10 shrink-0 text-xs font-bold uppercase">
                                    {download.format}
                                </span>
                                <QualityBadge
                                    className="uppercase"
                                    text={badgeText}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-text-secondary shrink-0 text-sm font-medium">
                                    {captionLine}
                                </span>
                                <span className="text-text-secondary ml-auto shrink-0 text-sm">
                                    {fileSize ?? 'N/A'}
                                </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <VideoDownloadAction
                                    Icon={DownloadIcon}
                                    title="Download"
                                    selected
                                    loading={loading}
                                    onClick={onDownloadClick}
                                />
                            </div>
                        </div>
                    )}
        </>
    );
}
