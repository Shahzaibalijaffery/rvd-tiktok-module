// src/core/content/tiktok-main-world-fetch.ts
import {
    RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER,
} from '@/core/content-main-world/protocol';
import { callTikTokMainWorld } from './tiktok-main-world-bridge-client';

const TIMEOUT_MS = 600_000;

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
        { timeoutMs: TIMEOUT_MS, signal: options?.signal },
    );
}