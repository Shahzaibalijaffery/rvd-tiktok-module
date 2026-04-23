import type {
    ExtensionOptions as BaseExtensionOptions,
    UserData as BaseUserData,
} from '@/system/types';

export interface ExtensionOptions extends BaseExtensionOptions {
    // Define options specific to this module
}

export interface UserData extends BaseUserData {
    // Define user data specific to this module
}

/**
 * Message types
 */
export interface M3u8AddDownloadType {
    url: string;
    title: string;
    quality: string;
    qualityLabel?: string;
}

export interface M3u8Mp3AddDownloadType {
    url: string;
    title: string;
    bitrate: string;
    length: number;
    startTime: number | null;
    endTime: number | null;
}

/** In-page active download row (HLS / progress UI). */
export type ActiveDownloadStatus = { state: 'queued' | 'canceled' }
    | { state: 'active'; type?: 'downloading' | 'processing'; progress?: number }
    | { state: 'complete'; downloadUrl?: string }
    | { state: 'failed'; message: string };

export interface ActiveDownload {
    /** HLS / progressive fetch in isolated world, or TikTok CDN save via main-world blob. */
    type: 'm3u8' | 'tiktok-blob';
    uuid: string;
    title: string;
    format: 'mp3' | 'mp4';
    quality: string;
    label?: string;
    status: ActiveDownloadStatus;
}
