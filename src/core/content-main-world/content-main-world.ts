import { installTikTokBlobDownloadMainWorld, wirePostMessageBridge } from './tiktok-blob-download';

export function initContentMainWorld(): void {
    installTikTokBlobDownloadMainWorld();
    wirePostMessageBridge();
}
