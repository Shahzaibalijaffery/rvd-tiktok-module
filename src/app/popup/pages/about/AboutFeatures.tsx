import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { __t } from '@/system/lib/i18n';
import { cn } from '@/system/lib/utils';

export default function AboutFeatures() {
    const [openList, setOpenList] = useState(false);
    const list = [
        __t('popup_feature_download_video', 'Download videos in multiple formats'),
        __t('popup_feature_extract_audio', 'Extract audio from videos'),
        __t('popup_feature_convert', 'Trim and convert media files'),
        __t('popup_feature_thumbnails_subtitles', 'Download thumbnails and subtitles'),
        __t('popup_feature_1000_websites', 'Support for 1000+ websites'),
    ];

    return (
        <div className="bg-tab-bg overflow-hidden rounded-xl border">
            <button
                onClick={() => setOpenList(!openList)}
                className="hover:bg-tab-hover flex w-full cursor-pointer items-center justify-between p-3 transition-colors focus:outline-none"
            >
                <span className="text-text-primary text-sm font-semibold">
                    Key Features
                </span>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 transition-transform duration-200 text-text-secondary',
                        openList && 'rotate-180',
                    )}
                />
            </button>

            {openList && (
                <div className="space-y-2 border-t px-3 pb-3">
                    {list.map((text, index) => (
                        <div key={index} className="flex items-start gap-2 pt-2">
                            <div className="bg-success/15 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                                <Check className="text-success h-2.5 w-2.5" />
                            </div>
                            <p className="text-text-primary text-xs leading-relaxed">
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
