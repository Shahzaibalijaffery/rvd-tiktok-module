import type { TikTokBlobDownloadPayload } from '@/core/content-main-world/tiktok-main-world-bridge';
// src/core/background/background.ts
import type { Message, MessageListener, MessageResponse } from '@/system/types';
import { isTikTokMediaDownloadSourceUrl } from '@/core/common/tiktok-cdn-url';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import { RUNTIME_MESSAGE_NAMESPACE } from '@/module-config';

import { onRuntimeMessage } from '@/system/background';

const RE_INVALID_FILENAME = /invalid filename/i;
const TAB_SEND_RETRIES = 5;
const TAB_SEND_BASE_DELAY_MS = 120;

interface DownloadPayload {
    url: string;
    filename?: string;
    saveAs?: boolean;
    conflictAction?: chrome.downloads.FilenameConflictAction;
    tabId?: number;
    chromeDirectForTikTokCdn?: boolean;
}

function formatCaughtError(e: unknown): string {
    if (e instanceof Error && typeof e.message === 'string' && e.message.trim())
        return e.message.trim();
    if (typeof e === 'string')
        return e;
    if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
        const m = (e as { message: string }).message.trim();
        if (m)
            return m;
    }
    try {
        return JSON.stringify(e);
    }
    catch {
        return String(e);
    }
}

async function resolveDownloadTargetTabId(
    explicit: number | undefined,
    sender: chrome.runtime.MessageSender,
): Promise<number | undefined> {
    if (typeof explicit === 'number' && explicit >= 0)
        return explicit;
    if (typeof sender.tab?.id === 'number')
        return sender.tab.id;
    const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return typeof t?.id === 'number' ? t.id : undefined;
}

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

function isRetriableTabSendError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return (
        msg.includes('Receiving end does not exist')
        || msg.includes('Could not establish connection')
        || msg.includes('message port closed')
    );
}

async function sendTikTokBlobDownloadToTab(tabId: number, payload: TikTokBlobDownloadPayload): Promise<void> {
    const message: Message<TikTokBlobDownloadPayload> = {
        namespace: RUNTIME_MESSAGE_NAMESPACE,
        targetPage: CONTENT_MESSAGE_PAGE,
        name: 'tikTok blob download',
        data: payload,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt < TAB_SEND_RETRIES; attempt++) {
        try {
            if (attempt > 0)
                await sleep(TAB_SEND_BASE_DELAY_MS * attempt);

            const response = await chrome.tabs.sendMessage(tabId, message) as MessageResponse<{ ok: true }>;

            if (response.error)
                throw new Error(response.message);

            return;
        }
        catch (e) {
            lastError = e;
            if (!isRetriableTabSendError(e) || attempt === TAB_SEND_RETRIES - 1)
                throw e;
        }
    }

    throw lastError;
}

/** Asks the tab’s isolated content -> postMessage -> manifest MAIN-world script to fetch + blob-save. */
async function downloadTikTokMediaViaMainWorld(tabId: number, mediaUrl: string, filenameHint: string | undefined): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    const pageUrl = tab.url ?? '';

    if (!/tiktok\.com/i.test(pageUrl)) {
        throw new Error('Keep the TikTok tab focused while downloading.');
    }

    const baseName = (filenameHint && filenameHint.trim())
        ? filenameHint.replace(/^.*[/\\]/, '').replace(/[/\\?*:|"<>]/g, '_').slice(0, 180)
        : 'video.mp4';

    const payload: TikTokBlobDownloadPayload = { mediaUrl, baseName };

    await sendTikTokBlobDownloadToTab(tabId, payload);
}

export async function initBackground() {
    const messageListeners: {
        'download': MessageListener<DownloadPayload, { id: number }>;
        'open downloads folder': MessageListener;
    } = {
        'download': async ({ url, filename, saveAs, conflictAction, tabId: dataTabId, chromeDirectForTikTokCdn }, { ok, fail, sender }) => {
            const saveAsResolved = typeof saveAs !== 'undefined' ? saveAs : false;

            const buildDirectOptions = (withFilename: boolean): chrome.downloads.DownloadOptions => {
                const o: chrome.downloads.DownloadOptions = {
                    url,
                    saveAs: saveAsResolved,
                };
                if (withFilename && typeof filename === 'string' && filename.length > 0)
                    o.filename = filename;
                if (conflictAction)
                    o.conflictAction = conflictAction;
                return o;
            };

            try {
                // TikTok *video* URLs need main-world blob save; some CDN stills (zoom covers) lack CORS for page fetch.
                if (isTikTokMediaDownloadSourceUrl(url) && !chromeDirectForTikTokCdn) {
                    const tabId = await resolveDownloadTargetTabId(dataTabId, sender);

                    if (typeof tabId !== 'number') {
                        return fail('No TikTok tab id available for main-world download.');
                    }

                    try {
                        await downloadTikTokMediaViaMainWorld(tabId, url, filename);
                        return ok({ id: -1 });
                    }
                    catch (e) {
                        return fail(formatCaughtError(e));
                    }
                }

                const id = await chrome.downloads.download(buildDirectOptions(true));
                return ok({ id });
            }
            catch (e) {
                const message = formatCaughtError(e);
                const isInvalidName = RE_INVALID_FILENAME.test(message);

                if (isInvalidName && filename) {
                    console.warn('[RVD] Invalid filename, retrying without suggested name', { filename, url: url.slice(0, 120) });
                    try {
                        const id = await chrome.downloads.download(buildDirectOptions(false));
                        return ok({ id });
                    }
                    catch (e2) {
                        console.error('[RVD] download failed (fallback)', formatCaughtError(e2), { url: url.slice(0, 120) });
                        return fail(formatCaughtError(e2));
                    }
                }

                console.error('[RVD] download failed', message, { url: url.slice(0, 120), filename });
                return fail(message);
            }
        },

        'open downloads folder': () => {
            chrome.downloads.showDefaultFolder();
        },
    };

    onRuntimeMessage(messageListeners);
}
