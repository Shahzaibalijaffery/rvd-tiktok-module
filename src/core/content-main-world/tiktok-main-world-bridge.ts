import type { TikTokBridgeOp } from './protocol';
import {
    RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML,
    RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST,
    RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD,
    RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER,
    RVD_TIKTOK_BRIDGE_SOURCE_ISO,
    RVD_TIKTOK_BRIDGE_SOURCE_MAIN,

} from './protocol';

export interface TikTokBlobDownloadPayload {
    mediaUrl: string;
    baseName: string;
}

type BridgeEventType
    = | typeof RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST
        | typeof RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML;

async function fetchTikTokMediaOrThrow(mediaUrl: string): Promise<Response> {
    const res = await fetch(mediaUrl, {
        credentials: 'include',
        mode: 'cors',
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    return res;
}

async function runTikTokBlobDownload(payload: TikTokBlobDownloadPayload): Promise<void> {
    const { mediaUrl, baseName } = payload;
    const res = await fetchTikTokMediaOrThrow(mediaUrl);

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

function requestUrlFromFetchArg(input: RequestInfo | URL): string {
    if (typeof input === 'string')
        return input;
    if (input instanceof URL)
        return input.toString();
    return input.url;
}

function postBridgeEvent(type: BridgeEventType, data: Record<string, unknown>): void {
    window.postMessage(
        {
            source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
            type,
            timestamp: Date.now(),
            ...data,
        },
        '*',
    );
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

const MAIN_WORLD_INTERCEPT_INSTALLED = '__rvdTikTokApiInterceptInstalled__';
const HYDRATION_EMIT_DEBOUNCE_MS = 300;
let hydrationEmitTimer: ReturnType<typeof setTimeout> | null = null;
let lastHydrationPayload = '';

function shouldCaptureTikTokItemListUrl(url: string): boolean {
    if (!url || !/^https?:\/\//i.test(url))
        return false;

    return /tiktok/i.test(url) && /item_list|itemlist|aweme\/v1\/feed/i.test(url);
}

function postApiItemListResponse(url: string, payload: unknown): void {
    postBridgeEvent(RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST, { url, payload });
}

function postDocumentHtmlResponse(url: string, html: string): void {
    postBridgeEvent(RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML, { url, html });
}

function emitHydrationSnapshotFromDom(): void {
    const script = document.querySelector<HTMLScriptElement>('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
    const payload = script?.textContent?.trim();
    if (!payload)
        return;
    if (payload === lastHydrationPayload)
        return;
    lastHydrationPayload = payload;
    const html = `<html><head><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${payload}</script></head><body></body></html>`;
    postDocumentHtmlResponse(location.href, html);
}

function scheduleHydrationSnapshotFromDom(): void {
    if (hydrationEmitTimer !== null) {
        clearTimeout(hydrationEmitTimer);
    }
    hydrationEmitTimer = setTimeout(() => {
        hydrationEmitTimer = null;
        emitHydrationSnapshotFromDom();
    }, HYDRATION_EMIT_DEBOUNCE_MS);
}

function installTikTokApiResponseInterception(): void {
    const g = globalThis as unknown as Record<string, unknown>;
    if (g[MAIN_WORLD_INTERCEPT_INSTALLED] === true)
        return;
    g[MAIN_WORLD_INTERCEPT_INSTALLED] = true;
    emitHydrationSnapshotFromDom();
    const mo = new MutationObserver(() => {
        scheduleHydrationSnapshotFromDom();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const res = await originalFetch(...args);
        try {
            const reqUrl = requestUrlFromFetchArg(args[0]);
            if (shouldCaptureTikTokItemListUrl(reqUrl)) {
                const cloned = res.clone();
                void cloned.json()
                    .then(json => postApiItemListResponse(reqUrl, json))
                    .catch(() => {});
            }
        }
        catch {
            // ignore interception failures
        }
        return res;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const xhrUrlKey = '__rvdTikTokXhrUrl__';

    XMLHttpRequest.prototype.open = function open(
        this: XMLHttpRequest & { [xhrUrlKey]?: string },
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null,
    ): void {
        this[xhrUrlKey] = String(url);
        return originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function send(
        this: XMLHttpRequest & { [xhrUrlKey]?: string },
        body?: Document | XMLHttpRequestBodyInit | null,
    ): void {
        this.addEventListener('loadend', () => {
            try {
                const reqUrl = this[xhrUrlKey] ?? '';
                if (!shouldCaptureTikTokItemListUrl(reqUrl))
                    return;
                if (this.responseType && this.responseType !== 'text')
                    return;
                if (typeof this.responseText !== 'string' || !this.responseText.trim())
                    return;
                const json = JSON.parse(this.responseText);
                postApiItemListResponse(reqUrl, json);
            }
            catch {
                // ignore interception failures
            }
        }, { once: true });

        return originalSend.call(this, body ?? null);
    };
}

function readMessageEnvelope(data: unknown): { token: string; op: TikTokBridgeOp; payload: unknown } | null {
    const d = data as { source?: unknown; token?: unknown; op?: unknown; payload?: unknown };
    if (d?.source !== RVD_TIKTOK_BRIDGE_SOURCE_ISO)
        return null;
    const token = String(d?.token ?? '');
    const op = d?.op as TikTokBridgeOp | undefined;
    if (!token || !op)
        return null;
    return { token, op, payload: d?.payload };
}

function handleFetchBufferOp(token: string, op: TikTokBridgeOp, payload: unknown): void {
    const mediaUrl = String((payload as { mediaUrl?: unknown })?.mediaUrl ?? '');
    if (!mediaUrl) {
        postFail(token, op, 'Missing mediaUrl.');
        return;
    }

    void fetchTikTokMediaOrThrow(mediaUrl)
        .then(async (res) => {
            const buffer = await res.arrayBuffer();
            postOk(token, op, buffer, [buffer]);
        })
        .catch(err => postFail(token, op, err));
}

function handleBlobDownloadOp(token: string, op: TikTokBridgeOp, payload: unknown): void {
    const req = payload as TikTokBlobDownloadPayload;
    if (!req?.mediaUrl || !req?.baseName) {
        postFail(token, op, 'Missing mediaUrl or baseName.');
        return;
    }

    void runTikTokBlobDownload(req)
        .then(() => postOk(token, op, { ok: true }))
        .catch(err => postFail(token, op, err));
}

/** Isolated content forwards postMessage here; this dispatches bridge operations. */
export function wireTikTokMainWorldBridge(): void {
    installTikTokApiResponseInterception();

    window.addEventListener('message', (ev: MessageEvent) => {
        if (ev.source !== window)
            return;
        const envelope = readMessageEnvelope(ev.data);
        if (!envelope)
            return;
        const { token, op, payload } = envelope;

        if (op === RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER) {
            handleFetchBufferOp(token, op, payload);
            return;
        }

        if (op === RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD) {
            handleBlobDownloadOp(token, op, payload);
        }
    });
}
