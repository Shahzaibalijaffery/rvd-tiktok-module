import { Crown } from 'lucide-react';

import { __t } from '@/system/lib/i18n';

export default function AboutHeader() {
    const version = chrome.runtime.getManifest().version;
    const logoUrl = chrome.runtime.getURL('assets/icons/icon-popup.png');

    return (
        <div className="bg-bg rounded-xl border p-4">
            <div className="flex items-start gap-3">
                <div className="bg-primary/10 h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <img
                        src={logoUrl}
                        className="h-full w-full object-contain p-2"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                        <div>
                            <h2 className="text-base font-bold leading-tight">{__t('popup_ext_name', 'Royal Video Downloader')}</h2>
                            <p className="text-text-secondary mt-0.5 text-xs">
                                {__t('popup_ext_by', 'by Addoncrop')}
                                {' '}
                                • v
                                {version}
                            </p>
                        </div>
                        <div className="bg-linear-to-r inline-flex shrink-0 items-center gap-1 rounded-md from-yellow-500 to-amber-500 px-2 py-1">
                            <Crown className="h-3 w-3 text-white" />
                            <span className="text-[10px] font-bold text-white">{__t('popup_about_badge', 'FREE')}</span>
                        </div>
                    </div>

                    <p className="text-text-secondary text-xs leading-relaxed">
                        {__t('ext_description', 'Download videos from 1000+ websites with fast and secure processing.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
