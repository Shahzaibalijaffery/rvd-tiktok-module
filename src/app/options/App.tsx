import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useOptionsStore } from './options-store';
import AudioDownloads from './sections/AudioDownloads';
import DownloadSettings from './sections/DownloadSettings';
import FilenameSettings from './sections/FilenameSettings';
import GeneralSettings from './sections/GeneralSettings';
import { Toast } from './sections/Toast';
import Sidebar from './Sidebar';

const SECTIONS = {
    'general': GeneralSettings,
    'audio-downloads': AudioDownloads,
    'download-settings': DownloadSettings,
    'file-naming': FilenameSettings,
} as const;

export default function App() {
    const [ready, isDarkMode, toast, activeSection, init, setToast] = useOptionsStore(useShallow(state => [
        state.ready,
        state.isDarkMode,
        state.toast,
        state.activeSection,

        state.init,
        state.setToast,
    ]));

    useEffect(() => {
        init();
    }, []);

    const ActiveSection = SECTIONS[activeSection];

    return ready && (
        <>
            <div className="font-sans antialiased">
                <div className={`${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <div className="flex min-h-screen">
                        <Sidebar />

                        <div className="w-full flex-1 overflow-y-auto">
                            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12">
                                <ActiveSection />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} isDarkMode={isDarkMode} />
            )}
        </>
    );
}
