import type { MediaInfo } from '@/system/types';
import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import { buildTikTokFeedMediaInfoFromApiResponse, buildTikTokFeedMediaInfoFromHtml } from '@/core/content/parser/tiktok-item-select';
import { getTikTokApiSnapshots, getTikTokDocumentSnapshots } from './tiktok-content-bridge';

const DEFAULT_MAX_WAIT_MS = 8000;

export function isTikTokWebDocument(): boolean {
    return /tiktok\.com$/i.test(location.hostname);
}

function mediaInfoFromInterceptedApi(videoId?: string | null): MediaInfo | null {
    const snapshots = getTikTokApiSnapshots();
    for (let i = snapshots.length - 1; i >= 0; i--) {
        const info = buildTikTokFeedMediaInfoFromApiResponse(snapshots[i]?.payload, videoId ?? undefined);
        if (info)
            return info;
    }
    return null;
}

function mediaInfoFromInterceptedDocument(videoId?: string | null): MediaInfo | null {
    const snapshots = getTikTokDocumentSnapshots();
    for (let i = snapshots.length - 1; i >= 0; i--) {
        const html = snapshots[i]?.html;
        if (typeof html !== 'string' || !html.trim())
            continue;
        const info = buildTikTokFeedMediaInfoFromHtml(html, videoId ?? undefined);
        if (info)
            return info;
    }
    return null;
}

async function mediaInfoFromPageWithRetry(maxWaitMs: number = DEFAULT_MAX_WAIT_MS): Promise<MediaInfo> {
    if (!isTikTokWebDocument()) {
        throw new Error('This does not look like a TikTok web page.');
    }

    const startTime = Date.now();
    let videoId: string | null = null;

    const urlMatch = window.location.href.match(/@([^/]+)\/video\/(\d+)/);
    if (urlMatch) {
        videoId = urlMatch[2] ?? '';
    }

    function extractVideoIdFromDom(): string | null {
        const videos = document.querySelectorAll<HTMLVideoElement>('video');
        if (!videos.length)
            return null;

        const viewportCenter = window.innerHeight / 2;
        let closest: HTMLVideoElement | null = null;
        let minDistance = Infinity;

        for (const video of videos) {
            const rect = video.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight)
                continue;

            const center = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenter - center);

            if (distance < minDistance) {
                minDistance = distance;
                closest = video;
            }
        }

        if (!closest)
            return null;

        const wrapper = closest.closest<HTMLElement>('[id^="xgwrapper-"]');
        const id = wrapper?.id.match(/(\d+)$/)?.[1] ?? null;
        return id;
    }

    async function waitForVideoId(): Promise<string | null> {
        const retryDelay = 250;

        while (Date.now() - startTime < maxWaitMs) {
            const id = extractVideoIdFromDom();
            if (id)
                return id;
            await new Promise(res => setTimeout(res, retryDelay));
        }

        return extractVideoIdFromDom();
    }

    if (!urlMatch) {
        const domVideoId = await waitForVideoId();
        videoId = videoId ?? domVideoId;
    }

    if (!videoId) {
        const fallbackInfo = mediaInfoFromInterceptedApi() ?? mediaInfoFromInterceptedDocument();
        if (fallbackInfo)
            return fallbackInfo;
        throw new Error('Could not reliably detect TikTok video info from DOM or snapshots.');
    }

    while (Date.now() - startTime < maxWaitMs) {
        const info = mediaInfoFromInterceptedApi(videoId);
        if (info)
            return info;
        const docInfo = mediaInfoFromInterceptedDocument(videoId);
        if (docInfo)
            return docInfo;
        await new Promise(res => setTimeout(res, 250));
    }

    throw new Error('Could not find intercepted TikTok data for this video yet.');
}

/** Content: `get video info` -> visible DOM identity -> parse intercepted API/HTML snapshots -> MediaInfo. */
export function registerPageVideoInfo(): void {
    const runtimeMessage = runtimeMessageInstance(CONTENT_MESSAGE_PAGE);
    runtimeMessage.on<{ url: string }, { info: MediaInfo }>(
        'get video info',
        async (_data, { ok, fail }) => {
            try {
                const info = await mediaInfoFromPageWithRetry();
                return ok({ info });
            }
            catch (error) {
                return fail(error instanceof Error ? error.message : String(error));
            }
        },
    );
}
