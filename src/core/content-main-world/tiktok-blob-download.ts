import {
    RVD_TIKTOK_BLOB_MSG_SOURCE_ISO,
    RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
    RVD_TIKTOK_BLOB_MSG_TYPE_REQUEST,
    RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
    RVD_TIKTOK_FETCH_BUF_MSG_TYPE_REQUEST,
    RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
} from './protocol';

export type TikTokBlobDownloadPayload = {
    mediaUrl: string;
    baseName: string;
};

export const RVD_TIKTOK_MAIN_WORLD_GLOBAL = '__rvdTikTokBlobDownload' as const;

async function runTikTokBlobDownload(payload: TikTokBlobDownloadPayload): Promise<void> {
    const { mediaUrl, baseName } = payload;

    const res = await fetch(mediaUrl, {
        credentials: 'include',
        mode: 'cors',
        cache: 'no-store',
    });

    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = baseName;
    a.style.display = 'none';
    const root = document.body ?? document.documentElement;
    root.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 180_000);
}

export function installTikTokBlobDownloadMainWorld(): void {
    const g = globalThis as unknown as Record<string, unknown>;
    const key = RVD_TIKTOK_MAIN_WORLD_GLOBAL;

    if (typeof g[key] === 'function')
        return;

    g[key] = runTikTokBlobDownload;
}

/** Isolated content forwards `postMessage` here; we reply when `fetch` + save finishes. */
export function wirePostMessageBridge(): void {
    window.addEventListener('message', (ev: MessageEvent) => {
        if (ev.source !== window)
            return;

        const d = ev.data;

        if (d?.source !== RVD_TIKTOK_BLOB_MSG_SOURCE_ISO)
            return;

        if (d?.type === RVD_TIKTOK_FETCH_BUF_MSG_TYPE_REQUEST) {
            const token = String(d.token ?? '');
            const mediaUrl = String(d.mediaUrl ?? '');

            if (!mediaUrl) {
                window.postMessage({
                    source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                    type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
                    token,
                    ok: false,
                    errorMessage: 'Missing mediaUrl.',
                }, '*');
                return;
            }

            void fetch(mediaUrl, {
                credentials: 'include',
                mode: 'cors',
                cache: 'no-store',
            })
                .then(async (res) => {
                    if (!res.ok)
                        throw new Error(`HTTP ${res.status}`);
                    const buffer = await res.arrayBuffer();
                    window.postMessage({
                        source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                        type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
                        token,
                        ok: true,
                        buffer,
                    }, '*', [buffer]);
                })
                .catch((err: unknown) => {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    window.postMessage({
                        source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                        type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
                        token,
                        ok: false,
                        errorMessage,
                    }, '*');
                });
            return;
        }

        if (d?.type !== RVD_TIKTOK_BLOB_MSG_TYPE_REQUEST)
            return;

        const token = String(d.token ?? '');
        const payload = d.payload as TikTokBlobDownloadPayload;
        const g = globalThis as unknown as Record<string, unknown>;
        const fn = g[RVD_TIKTOK_MAIN_WORLD_GLOBAL] as ((p: TikTokBlobDownloadPayload) => Promise<void>) | undefined;

        if (typeof fn !== 'function') {
            window.postMessage({
                source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
                token,
                ok: false,
                errorMessage: 'RVD TikTok main-world handler missing.',
            }, '*');
            return;
        }

        void fn(payload)
            .then(() => {
                window.postMessage({
                    source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                    type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
                    token,
                    ok: true,
                }, '*');
            })
            .catch((err: unknown) => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                window.postMessage({
                    source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
                    type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
                    token,
                    ok: false,
                    errorMessage,
                }, '*');
            });
    });
}
