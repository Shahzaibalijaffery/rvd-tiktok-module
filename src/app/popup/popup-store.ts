import type { ExtensionOptions } from '@/core/types';

import { create } from 'zustand';

import { options, userData } from '@/core/common/globals';
import { getActiveTab } from '@/core/common/helpers';
import { popupModule } from '@/core/popup/popup';
import Storage from '@/system/lib/Storage';

type PopupPage = 'download' | 'about' | 'rate-us';
export type DownloadTab = 'video' | 'audio' | 'thumbnails';

const pageTitles: Record<Exclude<PopupPage, 'download'>, string> = {
    'about': 'About',
    'rate-us': 'Rate Us',
};

const tabTitles: Record<DownloadTab, string> = {
    video: 'Download Video',
    audio: 'Trim and Convert MP3',
    thumbnails: 'Download Thumbnails',
};

interface PopupState {
    ready: boolean;
    noVideoAvailable: boolean;
    hasRated: boolean;
    setHasRated: (hasRated: boolean) => void;

    init: (videoInfoHook: (url: string, title: string, tab: chrome.tabs.Tab) => void) => Promise<void>;

    theme: ExtensionOptions['theme'];
    setTheme: (theme: ExtensionOptions['theme']) => void;
    changeTheme: () => Promise<void>;

    activePage: PopupPage;
    setActivePage: (page: PopupPage) => void;
    activeDownloadTab: DownloadTab;
    setActiveDownloadTab: (tab: DownloadTab) => void;

    getHeaderTitle: () => string;

    goBack: () => void;
}

export const usePopupStore = create<PopupState>((set, get) => ({
    ready: false,
    noVideoAvailable: false,
    hasRated: false,
    setHasRated(hasRated) {
        set({ hasRated });
    },

    async init(videoInfoHook) {
        const [tab, hasRated] = await Promise.all([
            getActiveTab(),
            Storage.sync.get('hasRated'),
            options.Ready,
            userData.Ready,
        ]);

        if (!tab)
            return;

        const { setTheme } = get();
        const { url } = tab;
        const inaccessiblePage = typeof url === 'undefined' || !url.startsWith('http');

        setTheme(options.theme);
        set({
            noVideoAvailable: inaccessiblePage,
            activePage: !inaccessiblePage ? 'download' : 'about',
            hasRated: !!hasRated,
        });

        // On Device theme change, check if theme is system and update accordingly
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const { theme } = get();

            if (theme === 'system') {
                setTheme('system');
            }
        });

        options.onChange('theme', newTheme => setTheme(newTheme));

        if (tab.url && popupModule.urlMatches(tab.url)) {
            videoInfoHook(tab.url, tab.title ?? 'Video', tab);
        }
        else {
            set({
                noVideoAvailable: true,
                activePage: 'about',
            });
        }

        set({ ready: true });
    },

    theme: 'light',
    setTheme(theme) {
        const systemInDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const activeTheme: 'light' | 'dark' = theme === 'system' ? (systemInDarkMode ? 'dark' : 'light') : theme;

        set({ theme });

        if (activeTheme === 'light') {
            document.documentElement.classList.remove('dark');
        }
        else {
            document.documentElement.classList.add('dark');
        }
    },
    async changeTheme() {
        const { theme: currentTheme, setTheme } = get();
        const theme = currentTheme === 'dark' ? 'light' : 'dark';

        await options.set('theme', theme);
        setTheme(theme);
    },

    activePage: 'download',
    setActivePage(page: PopupPage) {
        set({ activePage: page });
    },

    getHeaderTitle() {
        const { activePage, activeDownloadTab } = get();

        return activePage === 'download' ? tabTitles[activeDownloadTab] : pageTitles[activePage];
    },

    activeDownloadTab: 'video',
    setActiveDownloadTab(tab: DownloadTab) {
        set({ activeDownloadTab: tab });
    },

    goBack() {
        set({ activePage: 'download' });
        set({ activeDownloadTab: 'video' });
    },
}));
