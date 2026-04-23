import { __t } from '@/system/lib/i18n';

export default function Loader() {
    const logoUrl = chrome.runtime.getURL('assets/icons/icon-popup.png');

    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center">
            <div className="mb-6 text-center">
                <h2 className="mb-1 text-xl font-bold">
                    {__t('popup_ext_name', 'Royal Video Downloader')}
                </h2>
                <p className="text-text-secondary mb-2 text-xs">
                    {__t('popup_ext_by', 'by Addoncrop')}
                    {' '}
                    —
                    {' '}
                    {__t('loader_formerly', 'formerly YouTube Video Downloader')}
                </p>
                <p className="text-primary text-sm font-medium">
                    {__t('loader_description', 'Now supports 1000+ websites for fast and secure downloads.')}
                </p>
            </div>

            <div className="relative">
                <div className="border-t-primary h-16 w-16 animate-spin rounded-full border-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white/20">
                        <img src={logoUrl} className="h-full w-full object-contain p-1" />
                    </div>
                </div>
            </div>

            <p className="mt-6 animate-pulse text-base font-semibold">
                {__t('loader_loading_video', 'Loading video information...')}
            </p>
            <p className="text-text-secondary mt-2 text-sm">
                {__t('loader_wait_for_downloads', 'Please wait while we find available downloads')}
            </p>

            {/*
            <div className="bg-card-bg text-text-primary mt-8 flex w-full max-w-md items-start gap-3 rounded-lg border px-4 py-3">
                <Info className="text-info-blue mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-text-secondary text-xs leading-relaxed">
                    We're currently facing a signature issue on YouTube. Our team is working on it, and it will be back up soon.
                </p>
            </div>
            */}
        </div>
    );
}
