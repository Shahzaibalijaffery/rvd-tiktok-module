import type { Download } from '@/system/types';

import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

import { useVideoStore } from '@/app/popup/video-store';
import { __t } from '@/system/lib/i18n';
import { cn } from '@/system/lib/utils';
import DownloadItem from './DownloadItem';

interface Props {
    downloads: Download[];
}

export default function OtherDownloads({ downloads }: Props) {
    const viewMode = useVideoStore(state => state.viewMode);

    const [isExpanded, setIsExpanded] = useState(false);
    const [showAlert, setShowAlert] = useState(true);

    function toggleExpand() {
        setIsExpanded(!isExpanded);
    }

    function hideAlert() {
        setShowAlert(false);
    }

    return (
        <>
            <button
                className="bg-tab-bg hover:bg-secondary/60 group flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none"
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className="group-hover:bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg bg-white transition-colors dark:bg-[#3f3f3f]">
                        <AlertCircle className="group-hover:text-primary text-text-secondary h-4 w-4 transition-colors" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-color-black text-sm font-semibold">
                            {__t(
                                'other_available_videos',
                                'Other Available Videos',
                            )}
                        </span>
                        <span className="text-text-secondary text-xs">
                            {downloads.length}
                            {' '}
                            {__t('options_available', 'options available')}
                        </span>
                    </div>
                </div>
                <div className="group-hover:bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg bg-white transition-all duration-200 dark:bg-[#3f3f3f]">
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 transition-all group-hover:text-primary text-text-secondary',
                            isExpanded && 'rotate-180',
                        )}
                    />
                </div>
            </button>

            {isExpanded && (
                <>
                    {showAlert && (
                        <div className="text-info/80 bg-info/5 border-info/40 relative my-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs dark:text-blue-300">
                            <p className="flex-1 pr-6">
                                These videos may have lower quality, small file
                                sizes, or uncommon formats. Download at your
                                discretion.
                            </p>
                            <button
                                onClick={hideAlert}
                                className="hover:bg-info/15 text-info/60 hover:text-info absolute right-2 top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div
                        className={cn(
                            'mb-6',
                            viewMode === 'list'
                                ? 'flex gap-2 flex-col'
                                : 'grid grid-cols-2 gap-3',
                        )}
                    >
                        {downloads.map(download => (
                            <DownloadItem
                                viewMode={viewMode}
                                key={download.id}
                                download={download}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
