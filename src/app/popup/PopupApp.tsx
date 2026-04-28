import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Toaster } from '@/app/components/ui/sonner';
import { useVideoStore } from '@/app/popup/video-store';
import Header from './header/Header';
import AboutPage from './pages/about/AboutPage';
import DownloadPage from './pages/download/DownloadPage';
import RateUsPage from './pages/rate-us/RateUsPage';
import { usePopupStore } from './popup-store';

export default function PopupApp() {
    const [ready, theme, activePage, init] = usePopupStore(
        useShallow(state => [
            state.ready,
            state.theme,
            state.activePage,

            state.init,
        ]),
    );

    const fetchInfo = useVideoStore(state => state.fetchInfo);
    const didInit = useRef(false);

    useEffect(() => {
        if (didInit.current) {
            return;
        }

        didInit.current = true;
        init(fetchInfo);
    }, [init, fetchInfo]);

    return (
        ready && (
            <>
                <div className="bg-bg max-w-105 w-full overflow-hidden">
                    <Header />

                    {activePage === 'download' && <DownloadPage />}
                    {activePage === 'about' && <AboutPage />}
                    {activePage === 'rate-us' && <RateUsPage />}
                </div>

                <Toaster theme={theme} />
            </>
        )
    );
}
