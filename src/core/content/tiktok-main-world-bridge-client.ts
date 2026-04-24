// src/core/content/tiktok-main-world-bridge-client.ts
import {
    RVD_TIKTOK_BRIDGE_SOURCE_ISO,
    RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
    type TikTokBridgeOp,
} from '@/core/content-main-world/protocol';

type BridgeOk<T> = { ok: true; data: T };
type BridgeFail = { ok: false; errorMessage: string };

export async function callTikTokMainWorld<TReq, TRes>(
    op: TikTokBridgeOp,
    payload: TReq,
    options?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<TRes> {
    const timeoutMs = options?.timeoutMs ?? 600_000;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

    if (options?.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    return new Promise<TRes>((resolve, reject) => {
        let t: ReturnType<typeof setTimeout> | undefined;

        const cleanup = () => {
            window.removeEventListener('message', onReply);
            options?.signal?.removeEventListener('abort', onAbort);
            if (t !== undefined) clearTimeout(t);
        };

        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        const onReply = (ev: MessageEvent) => {
            if (ev.source !== window) return;

            const d = ev.data;
            if (
                d?.source !== RVD_TIKTOK_BRIDGE_SOURCE_MAIN
                || d?.token !== token
                || d?.op !== op
            ) {
                return;
            }

            cleanup();

            if (d.ok === true) {
                const out = d as BridgeOk<TRes>;
                resolve(out.data);
                return;
            }

            const err = d as BridgeFail;
            reject(new Error(err.errorMessage || 'Main-world bridge failed'));
        };

        window.addEventListener('message', onReply);
        options?.signal?.addEventListener('abort', onAbort, { once: true });

        t = setTimeout(() => {
            cleanup();
            reject(new Error(`TikTok bridge timed out (${op}).`));
        }, timeoutMs);

        window.postMessage(
            { source: RVD_TIKTOK_BRIDGE_SOURCE_ISO, token, op, payload },
            '*',
        );
    });
}