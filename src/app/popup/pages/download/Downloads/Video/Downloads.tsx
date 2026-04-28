import type { Download, MediaInfo } from '@/system/types';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import Filters from '@/app/components/Filters';
import { useVideoStore } from '@/app/popup/video-store';
import {
    downloadResolutionShortSide,
    qualityLabelFromDownload,
} from '@/core/common/download-quality-tier';
import { __t } from '@/system/lib/i18n';
import { cn } from '@/system/lib/utils';
import DownloadItem from './DownloadItem';
import OtherDownloads from './OtherDownloads';

function filterDownloadsBySearch(
    downloads: Download[],
    query: string,
    info: MediaInfo,
): Download[] {
    const q = query.trim().toLowerCase();
    if (!q)
        return downloads;

    const singleHaystack
        = info.type === 'single'
            ? [info.title, info.author]
                    .filter(Boolean)
                    .map(s => String(s).toLowerCase())
            : [];

    return downloads.filter((d) => {
        const hay = [d.title, d.quality, d.format, ...singleHaystack]
            .filter(Boolean)
            .map(s => String(s).toLowerCase());
        return hay.some(h => h.includes(q));
    });
}

export default function VideoDownloads() {
    const [viewMode, info, sortOrder, downloadSearchQuery] = useVideoStore(
        useShallow(state => [
            state.viewMode,
            state.info,
            state.sortOrder,
            state.downloadSearchQuery,
        ]),
    );

    if (!info)
        return null;

    const maxQualityNumber = useMemo(
        () =>
            Math.max(0, ...info.downloads.map(d => downloadResolutionShortSide(d))),
        [info.downloads],
    );

    const filteredDownloads = useMemo(
        () =>
            filterDownloadsBySearch(info.downloads, downloadSearchQuery, info),
        [info, downloadSearchQuery],
    );

    const { recommendedDownloads, otherDownloads } = useMemo(() => {
        function isRecommended(
            download: Download,
            maxQualityAvailable?: number,
        ) {
            const px = downloadResolutionShortSide(download);
            if (!maxQualityAvailable || !px) {
                return qualityLabelFromDownload(download) !== 'sd';
            }

            return (
                (maxQualityAvailable > 720 && px >= 720)
                || (maxQualityAvailable <= 720 && px >= 480)
            );
        }

        const recommended: Download[] = [];
        const other: Download[] = [];
        for (const download of filteredDownloads) {
            if (isRecommended(download, maxQualityNumber)) {
                recommended.push(download);
            }
            else {
                other.push(download);
            }
        }
        return { recommendedDownloads: recommended, otherDownloads: other };
    }, [filteredDownloads, maxQualityNumber]);

    const sortedRecommendedDownloads = useMemo(() => {
        return [...recommendedDownloads].sort((a, b) => {
            const pa = downloadResolutionShortSide(a);
            const pb = downloadResolutionShortSide(b);
            if (!pa || !pb)
                return 0;
            return sortOrder === 'asc' ? pa - pb : pb - pa;
        });
    }, [recommendedDownloads, sortOrder]);

    const sortedOtherDownloads = useMemo(() => {
        return [...otherDownloads].sort((a, b) => {
            const pa = downloadResolutionShortSide(a);
            const pb = downloadResolutionShortSide(b);
            if (!pa || !pb)
                return 0;
            return sortOrder === 'asc' ? pa - pb : pb - pa;
        });
    }, [otherDownloads, sortOrder]);

    const searchActive = downloadSearchQuery.trim().length > 0;
    const noMatchesAfterFilter = searchActive && filteredDownloads.length === 0;

    if (noMatchesAfterFilter) {
        return (
            <div className="col-span-2 mt-6 mb-2">
                <p className="text-center text-sm font-medium">
                    {__t(
                        'popup_download_search_no_matches',
                        'No matching downloads',
                    )}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4 flex items-center">
                <h3 className="text-color-black mr-auto flex items-center gap-2 text-sm font-bold">
                    {__t('recommended_downloads', 'Recommended for Download')}
                    {recommendedDownloads.length > 0 && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            {recommendedDownloads.length}
                        </span>
                    )}
                </h3>

                <Filters inline={true} />
            </div>

            {recommendedDownloads.length !== 0
                ? (
                        <div
                            className={cn(
                                'mb-6',
                                viewMode === 'list'
                                    ? 'flex gap-2 flex-col'
                                    : 'grid grid-cols-2 gap-3',
                            )}
                        >
                            {sortedRecommendedDownloads.map(download => (
                                <DownloadItem
                                    viewMode={viewMode}
                                    key={download.id}
                                    download={download}
                                />
                            ))}
                        </div>
                    )
                : (
                        <div className="col-span-2 mb-2 mt-4">
                            <p className="text-center text-sm font-medium">
                                No Result Found
                            </p>
                        </div>
                    )}

            {otherDownloads.length > 0 && (
                <OtherDownloads downloads={sortedOtherDownloads} />
            )}
        </>
    );
}
