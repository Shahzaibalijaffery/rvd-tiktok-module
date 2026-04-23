import {
    RVD_TIKTOK_BLOB_MSG_SOURCE_ISO,
    RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
    RVD_TIKTOK_FETCH_BUF_MSG_TYPE_REQUEST,
    RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
} from '@/core/content-main-world/protocol';

const TIMEOUT_MS = 600_000;

/**
 * Fetches TikTok CDN / media URLs in the page main world (cookies + referer),
 * then returns the bytes to the isolated content script.
 */
export async function fetchTikTokMediaArrayBufferInPage(
    mediaUrl: string,
    options?: { signal?: AbortSignal },
): Promise<ArrayBuffer> {
    if (!/tiktok\.com/i.test(location.hostname))
        throw new Error('Keep this tab on TikTok.');

    if (options?.signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');

    return new Promise((resolve, reject) => {
        const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

        let t: ReturnType<typeof setTimeout> | undefined;

        const cleanup = () => {
            window.removeEventListener('message', onReply);
            options?.signal?.removeEventListener('abort', onAbort);
            if (t !== undefined)
                clearTimeout(t);
        };

        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        const onReply = (ev: MessageEvent) => {
            if (ev.source !== window)
                return;
            const d = ev.data;
            if (d?.source !== RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN
                || d?.type !== RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT
                || d.token !== token)
                return;

            cleanup();

            if (d.ok === true) {
                const buf = d.buffer;
                if (buf instanceof ArrayBuffer) {
                    resolve(buf);
                    return;
                }
            }
            reject(new Error(typeof d.errorMessage === 'string' ? d.errorMessage : 'TikTok media fetch failed'));
        };

        window.addEventListener('message', onReply);
        options?.signal?.addEventListener('abort', onAbort, { once: true });

        t = setTimeout(() => {
            cleanup();
            reject(new Error('TikTok media fetch timed out.'));
        }, TIMEOUT_MS);

        window.postMessage({
            source: RVD_TIKTOK_BLOB_MSG_SOURCE_ISO,
            type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_REQUEST,
            token,
            mediaUrl,
        }, '*');
    });
}
