import type { Download, MediaInfo, Mp3Bitrate, Thumbnail } from '@/system/types';
import { toast } from 'sonner';
import { create } from 'zustand';

import { popupModule } from '@/core/popup/popup';

interface VideoState {
    fetching: boolean;
    error: string | null;
    info: MediaInfo | null;
    videoTitle: string | null;

    fetchInfo: (url: string, title: string, tab: chrome.tabs.Tab) => Promise<void>;
    resetInfo: () => void;

    viewMode: 'list' | 'grid';
    toggleViewMode: () => void;
    sortOrder: 'asc' | 'desc' | null;
    toggleSortOrder: () => void;

    downloadSearchQuery: string;
    setDownloadSearchQuery: (query: string) => void;

    downloadVideo: (download: Download) => Promise<void>;
    convertToMp3: (
        bitrate: Mp3Bitrate,
        startTime: number | null,
        endTime: number | null,
    ) => Promise<void>;
    downloadThumbnail: (thumbnail: Thumbnail) => Promise<void>;
}

export const useVideoStore = create<VideoState>((set, get) => ({
    fetching: false,
    error: null,
    info: null,
    videoTitle: null,

    async fetchInfo(url, title, tab) {
        set({ fetching: true, videoTitle: title, downloadSearchQuery: '' });

        if (typeof tab.id !== 'number') {
            set({ fetching: false, error: 'Could not access the active tab' });
            return;
        }

        try {
            const info = await popupModule.getInfo(url, tab.id, tab);
            const videoTitle = info.type === 'single' ? info.title : title;
            set({ fetching: false, info, videoTitle });
        }
        catch (error) {
            set({ fetching: false, error: (error as Error).message });
        }
    },

    resetInfo() {
        set({ fetching: false, error: null, info: null, downloadSearchQuery: '' });
    },

    viewMode: 'list',
    toggleViewMode() {
        const currentValue = get().viewMode;
        set({ viewMode: currentValue === 'grid' ? 'list' : 'grid' });
    },
    sortOrder: null,
    toggleSortOrder() {
        const currentValue = get().sortOrder;
        set({ sortOrder: currentValue === 'asc' ? 'desc' : 'asc' });
    },

    downloadSearchQuery: '',
    setDownloadSearchQuery(query) {
        set({ downloadSearchQuery: query });
    },

    async downloadVideo(download) {
        const { info } = get();

        try {
            await popupModule.downloadItem(download, info ?? undefined);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : String(error));
        }
    },

    async convertToMp3(bitrate, startTime, endTime) {
        const { info } = get();

        try {
            await popupModule.convertToMp3?.(bitrate, startTime, endTime, info ?? undefined);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : String(error));
        }
    },

    async downloadThumbnail(thumbnail) {
        const { info } = get();

        try {
            await popupModule.downloadThumbnail(thumbnail, info ?? undefined);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : String(error));
        }
    },
}));
