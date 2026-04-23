import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import ProgressBar from '@/app/components/ProgressBar';
import Badge from '@/app/components/ui/badge';
import useDownloadsStore from './downloads-store';

export default function ActiveDownloadsPanel() {
    const [downloads, cancelDownload] = useDownloadsStore(useShallow(state => ([
        state.downloads,
        state.cancelDownload,
    ])));

    const [isOpen, setIsOpen] = useState(true);
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (downloads.length > 0)
            setIsOpen(true);
    }, [downloads]);

    useEffect(() => {
        setActive(downloads.some(item => item.status.state === 'queued' || item.status.state === 'active'));
    }, [downloads]);

    return isOpen && (
        <div
            className="grid w-[400px] gap-1 rounded-lg border-2 border-card-border bg-card-bg p-4 text-text-primary shadow-xl transition-all duration-300"
        >
            <div className="flex items-center">
                <h4 className="text-[18px] font-semibold">
                    Keep this tab open to continue
                </h4>
                {!active && (
                    <span
                        className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-hover-color"
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={18} />
                    </span>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto">
                {downloads.map(item => (
                    <div key={item.uuid} className="flex items-center justify-between pt-4">
                        <div className="w-[65%]">
                            <h3 className="mb-2 w-[300px] truncate text-sm font-medium whitespace-nowrap">
                                {item.title}
                            </h3>

                            <div className="flex items-center justify-between py-2 text-[13px] font-normal text-text-secondary">
                                <span>{item.format.toUpperCase()}</span>
                                <div className="flex items-center gap-2">
                                    {typeof item.label !== 'undefined' && (
                                        <Badge text={item.label} />
                                    )}
                                    <span>{item.quality}</span>
                                </div>

                                {item.status.state === 'queued' && (
                                    <span className="w-[70px] rounded bg-secondary py-[3px] text-center text-[10px] font-medium text-text-secondary">
                                        Queued
                                    </span>
                                )}

                                {item.status.state === 'active' && (!item.status.type || item.status.type === 'downloading') && (
                                    <span className="w-[70px] rounded bg-success/15 py-[3px] text-center text-[10px] font-medium text-success">
                                        Downloading
                                    </span>
                                )}

                                {item.status.state === 'active' && item.status.type === 'processing' && (
                                    <span className="w-[70px] rounded bg-warning/20 py-[3px] text-center text-[10px] font-medium text-warning">
                                        Processing
                                    </span>
                                )}

                                {item.status.state === 'complete' && (
                                    <span className="w-[70px] rounded bg-info/15 py-[3px] text-center text-[10px] font-medium text-info">
                                        Complete
                                    </span>
                                )}

                                {item.status.state === 'canceled' && (
                                    <span className="w-[70px] rounded bg-secondary py-[3px] text-center text-[10px] font-medium text-text-secondary">
                                        Canceled
                                    </span>
                                )}

                                {item.status.state === 'failed' && (
                                    <span
                                        className="w-[70px] rounded bg-error/15 py-[3px] text-center text-[10px] font-medium text-error"
                                        title={item.status.message}
                                    >
                                        Failed
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.status.state === 'active' && item.type === 'tiktok-blob' && (
                                <span className="text-text-secondary w-[52px] text-center text-xs">
                                    Saving…
                                </span>
                            )}
                            {item.status.state === 'active' && item.type === 'm3u8' && (
                                <ProgressBar
                                    percentage={item.status.progress ?? 0}
                                    onClose={() => cancelDownload(item.uuid)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
