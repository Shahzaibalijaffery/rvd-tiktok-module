// src/core/content-main-world/tiktok-blob-download.ts
import {
    RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD,
    RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER,
    RVD_TIKTOK_BRIDGE_OP_FETCH_PAGE_HTML,
    RVD_TIKTOK_BRIDGE_SOURCE_ISO,
    RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
    type TikTokBridgeOp,
} from './protocol';

export type TikTokBlobDownloadPayload = {
    mediaUrl: string;
    baseName: string;
};

async function runTikTokBlobDownload(payload: TikTokBlobDownloadPayload): Promise<void> {
    const { mediaUrl, baseName } = payload;

    const res = await fetch(mediaUrl, {
        credentials: 'include',
        mode: 'cors',
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

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

/** Kept for compatibility with existing init call site. */
export function installTikTokBlobDownloadMainWorld(): void {
    // no-op
}

function postOk<T>(token: string, op: TikTokBridgeOp, data: T, transfer?: Transferable[]): void {
    window.postMessage(
        {
            source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
            token,
            op,
            ok: true as const,
            data,
        },
        '*',
        transfer,
    );
}

function postFail(token: string, op: TikTokBridgeOp, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    window.postMessage(
        {
            source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
            token,
            op,
            ok: false as const,
            errorMessage,
        },
        '*',
    );
}

/** Isolated content forwards postMessage here; this dispatches bridge operations. */
export function wirePostMessageBridge(): void {
    window.addEventListener('message', (ev: MessageEvent) => {
        if (ev.source !== window) return;

        const d = ev.data;
        if (d?.source !== RVD_TIKTOK_BRIDGE_SOURCE_ISO) return;

        const token = String(d?.token ?? '');
        const op = d?.op as TikTokBridgeOp | undefined;
        const payload = d?.payload;

        if (!token || !op) return;

        if (op === RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER) {
            const mediaUrl = String(payload?.mediaUrl ?? '');

            if (!mediaUrl) {
                postFail(token, op, 'Missing mediaUrl.');
                return;
            }

            void fetch(mediaUrl, {
                credentials: 'include',
                mode: 'cors',
                cache: 'no-store',
            })
                .then(async (res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const buffer = await res.arrayBuffer();
                    postOk(token, op, buffer, [buffer]);
                })
                .catch(err => postFail(token, op, err));

            return;
        }

        if (op === RVD_TIKTOK_BRIDGE_OP_FETCH_PAGE_HTML) {
            const pageUrl = String(payload?.pageUrl ?? '');

            if (!pageUrl) {
                postFail(token, op, 'Missing pageUrl.');
                return;
            }

            void fetch(pageUrl, {
                credentials: 'include',
                mode: 'cors',
                cache: 'no-store',
            })
                .then(async (res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const html = await res.text();
                    postOk(token, op, { html });
                })
                .catch(err => postFail(token, op, err));

            return;
        }

        if (op === RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD) {
            const req = payload as TikTokBlobDownloadPayload;

            if (!req?.mediaUrl || !req?.baseName) {
                postFail(token, op, 'Missing mediaUrl or baseName.');
                return;
            }

            void runTikTokBlobDownload(req)
                .then(() => postOk(token, op, { ok: true }))
                .catch(err => postFail(token, op, err));
        }
    });
}