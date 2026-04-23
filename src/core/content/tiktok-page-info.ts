import type { MediaInfo } from '@/system/types';

import { buildTikTokFeedMediaInfoFromHtml } from '@/core/background/tiktok-html-parse';
import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';

import { isTikTokWebDocument, resolveTikTokPageVideoIdentity } from './tiktok-video-identity';

const RETRY_INTERVAL_MS = 400;
const DEFAULT_MAX_WAIT_MS = 8000;

function buildTikTokDetailPageUrl(uniqueId: string, videoId: string): string {
    const handle = uniqueId.replace(/^@/, '');
    return `https://www.tiktok.com/@${encodeURIComponent(handle)}/video/${videoId}`;
}

async function requestPageHtmlFromBackground(pageUrl: string): Promise<string> {
    const response = await runtimeMessageInstance(CONTENT_MESSAGE_PAGE).send<{ url: string }, { html: string }>(
        'background',
        'fetch tiktok page html',
        { url: pageUrl },
    );

    if (response.error)
        throw new Error(response.message);
    return response.data.html;
}

async function mediaInfoFromPageWithRetry(maxWaitMs: number = DEFAULT_MAX_WAIT_MS): Promise<MediaInfo> {
    if (!isTikTokWebDocument()) {
        throw new Error('This does not look like a TikTok web page.');
    }

    let url = window.location.href;
    if(url.match(/@([^/]+)\/video\/(\d+)/)){
        const match = url.match(/@([^/]+)\/video\/(\d+)/)
        if(match) {
            const handle = `@${match[1]}`;
            const videoId = match[2] ?? '';
            const pageUrl = buildTikTokDetailPageUrl(handle, videoId);
            const html = await requestPageHtmlFromBackground(pageUrl);
            const info =  buildTikTokFeedMediaInfoFromHtml(html, videoId);
            if (!info) {
                throw new Error('Could not parse TikTok video from the fetched page.');
            }
            return info as MediaInfo;
        }
    }


    const deadline = Date.now() + maxWaitMs;
    let lastError = new Error(
        'Could not read a visible TikTok video on this page yet. Scroll so a video is on screen, or open a video permalink.',
    );

    while (Date.now() < deadline) {
        const dom = resolveTikTokPageVideoIdentity();

        if (!dom) {
            lastError = new Error('Could not read video id and author from the page yet.');
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
            continue;
        }

        const pageUrl = buildTikTokDetailPageUrl(dom.uniqueId, dom.videoId);

        try {
            const html = await requestPageHtmlFromBackground(pageUrl);
            const info = buildTikTokFeedMediaInfoFromHtml(html, dom.videoId);

            if (!info) {
                throw new Error('Could not parse TikTok video from the fetched page.');
            }

            return info;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
        }
    }

    throw lastError;
}

/** Content: `get video info` → visible DOM identity → background HTML → parse → {@link MediaInfo}. */
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
