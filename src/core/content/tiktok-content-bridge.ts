import type { TikTokBridgeOp } from '@/core/content-main-world/protocol';
import type { TikTokBlobDownloadPayload } from '@/core/content-main-world/tiktok-main-world-bridge';
import type { MessageResponse } from '@/system/types';
import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import {
    RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML,
    RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST,
    RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD,
    RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER,
    RVD_TIKTOK_BRIDGE_SOURCE_ISO,
    RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
} from '@/core/content-main-world/protocol';
import useDownloadsStore from './ActiveDownloads/downloads-store';

interface BridgeOk<T> { ok: true; data: T }
interface BridgeFail { ok: false; errorMessage: string }

const BLOB_DOWNLOAD_TIMEOUT_MS = 610_000;
const BUFFER_FETCH_TIMEOUT_MS = 600_000;
const MAX_API_SNAPSHOTS = 30;
const MAX_DOCUMENT_SNAPSHOTS = 15;

interface TikTokApiSnapshot {
    url: string;
    payload: unknown;
    timestamp: number;
}
interface TikTokDocumentSnapshot {
    url: string;
    html: string;
    timestamp: number;
}

const apiSnapshots: TikTokApiSnapshot[] = [];
const documentSnapshots: TikTokDocumentSnapshot[] = [];
let apiInterceptionListenerRegistered = false;

function registerTikTokApiInterceptionListener(): void {
    if (apiInterceptionListenerRegistered)
        return;
    apiInterceptionListenerRegistered = true;

    window.addEventListener('message', (ev: MessageEvent) => {
        if (ev.source !== window)
            return;

        const d = ev.data;
        if (
            d?.source !== RVD_TIKTOK_BRIDGE_SOURCE_MAIN
            || d?.type !== RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST
            || typeof d?.url !== 'string'
        ) {
            if (
                d?.source !== RVD_TIKTOK_BRIDGE_SOURCE_MAIN
                || d?.type !== RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML
                || typeof d?.url !== 'string'
                || typeof d?.html !== 'string'
            ) {
                return;
            }

            documentSnapshots.push({
                url: d.url,
                html: d.html,
                timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
            });
            if (documentSnapshots.length >= 2) {
                const prev = documentSnapshots[documentSnapshots.length - 2];
                const last = documentSnapshots[documentSnapshots.length - 1];
                if (prev && last && prev.url === last.url && prev.html === last.html) {
                    documentSnapshots.pop();
                    return;
                }
            }
            if (documentSnapshots.length > MAX_DOCUMENT_SNAPSHOTS) {
                documentSnapshots.splice(0, documentSnapshots.length - MAX_DOCUMENT_SNAPSHOTS);
            }
            return;
        }

        apiSnapshots.push({
            url: d.url,
            payload: d.payload,
            timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
        });

        if (apiSnapshots.length > MAX_API_SNAPSHOTS) {
            apiSnapshots.splice(0, apiSnapshots.length - MAX_API_SNAPSHOTS);
        }
    });
}

export function getTikTokApiSnapshots(): readonly TikTokApiSnapshot[] {
    return apiSnapshots;
}

export function getTikTokDocumentSnapshots(): readonly TikTokDocumentSnapshot[] {
    return documentSnapshots;
}

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
        let onReply: (ev: MessageEvent) => void = () => {};
        let onAbort: () => void = () => {};

        const cleanup = () => {
            window.removeEventListener('message', onReply);
            options?.signal?.removeEventListener('abort', onAbort);
            if (t !== undefined)
                clearTimeout(t);
        };

        onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };

        onReply = (ev: MessageEvent) => {
            if (ev.source !== window)
                return;

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

/** Bridges background -> isolated content -> main world via shared bridge client. */
export function registerTikTokBlobDownloadBridge(): void {
    registerTikTokApiInterceptionListener();

    const runtimeMessage = runtimeMessageInstance(CONTENT_MESSAGE_PAGE);

    runtimeMessage.on<TikTokBlobDownloadPayload, { ok: true }>(
        'tikTok blob download',
        async (data, { ok, fail }): Promise<MessageResponse<{ ok: true }>> => {
            if (!/tiktok\.com/i.test(location.hostname)) {
                return fail('Keep this tab on TikTok to download.');
            }

            const rowUuid = useDownloadsStore.getState().beginTikTokBlobDownload(data.baseName);
            const { updateStatus } = useDownloadsStore.getState();

            try {
                await callTikTokMainWorld<TikTokBlobDownloadPayload, { ok: true }>(
                    RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD,
                    data,
                    { timeoutMs: BLOB_DOWNLOAD_TIMEOUT_MS },
                );

                updateStatus(rowUuid, { state: 'complete' });
                return ok({ ok: true });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                updateStatus(rowUuid, { state: 'failed', message });
                return fail(message);
            }
        },
    );
}

/**
 * Fetches TikTok CDN / media URLs in the page main world (cookies + referer),
 * then returns bytes to isolated content script.
 */
export async function fetchTikTokMediaArrayBufferInPage(
    mediaUrl: string,
    options?: { signal?: AbortSignal },
): Promise<ArrayBuffer> {
    if (!/tiktok\.com/i.test(location.hostname)) {
        throw new Error('Keep this tab on TikTok.');
    }

    return callTikTokMainWorld<{ mediaUrl: string }, ArrayBuffer>(
        RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER,
        { mediaUrl },
        { timeoutMs: BUFFER_FETCH_TIMEOUT_MS, signal: options?.signal },
    );
}
