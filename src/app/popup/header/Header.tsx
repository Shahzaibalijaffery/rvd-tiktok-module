import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { useVideoStore } from '@/app/popup/video-store';
import { __t } from '@/system/lib/i18n';
import { usePopupStore } from '../popup-store';
import DownloadSearchBar from './DownloadSearchBar';
import MenuDropdown from './MenuDropdown';

export default function Header() {
    const [
        goBack,
        getHeaderTitle,
        noVideoAvailable,
        activePage,
        activeDownloadTab,
    ] = usePopupStore(
        useShallow(state => [
            state.goBack,
            state.getHeaderTitle,
            state.noVideoAvailable,
            state.activePage,
            state.activeDownloadTab,
        ]),
    );

    const [videoTitle, info] = useVideoStore(
        useShallow(state => [state.videoTitle, state.info]),
    );

    const logoUrl = chrome.runtime.getURL('assets/icons/icon-popup.png');

    return (
        <header className="bg-primary relative z-30 px-5 py-4 text-white dark:bg-[#212121]">
            <div className="mb-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10 hover:bg-white/30">
                        <img
                            src={logoUrl}
                            className="h-full w-full object-contain p-1.5"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold leading-tight">
                            {__t('popup_ext_name', 'TikTok Video Downloader')}
                        </span>
                        <span className="text-white-70 text-[10px] leading-tight">
                            {__t('popup_ext_by', 'by Addoncrop')}
                        </span>
                    </div>
                </div>

                <MenuDropdown />
            </div>

            <div className="border-t border-white/20 pt-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold leading-tight text-white">
                            {getHeaderTitle()}
                        </h1>
                        {activePage === 'download' && (
                            <p className="text-white-70 truncate text-xs leading-tight mt-1">
                                {noVideoAvailable
                                    ? 'No videos available on this page'
                                    : videoTitle}
                            </p>
                        )}
                    </div>

                    {activePage !== 'download' && !noVideoAvailable && (
                        <button
                            onClick={goBack}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20 transition-all hover:scale-110 hover:bg-white/30 focus:outline-none"
                        >
                            <X className="h-4 w-4 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {activePage === 'download'
                && activeDownloadTab === 'video'
                && !noVideoAvailable
                && info
                && info.downloads.length > 0 && <DownloadSearchBar />}
        </header>
    );
}
