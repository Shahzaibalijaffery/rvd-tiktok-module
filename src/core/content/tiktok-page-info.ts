import type { MediaInfo } from '@/system/types';
import { buildTikTokFeedMediaInfoFromHtml } from '@/core/background/tiktok-html-parse';
import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';

const RETRY_INTERVAL_MS = 400;
const DEFAULT_MAX_WAIT_MS = 8000;
const MAX_RETRIES = 3;

export function isTikTokWebDocument(): boolean {
    return /tiktok\.com$/i.test(location.hostname);
}

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

async function mediaInfoFromPageWithRetry(
    maxWaitMs: number = DEFAULT_MAX_WAIT_MS
  ): Promise<MediaInfo> {
    if (!isTikTokWebDocument()) {
      throw new Error('This does not look like a TikTok web page.');
    }
  
    const startTime = Date.now();
    let handle: string | null = null;
    let videoId: string | null = null;
  
    const urlMatch = window.location.href.match(/@([^/]+)\/video\/(\d+)/);
    if (urlMatch) {
      handle = urlMatch[1] ?? null;
      videoId = urlMatch[2] ?? '';
    }
  
    function extractFromDom(): { videoId: string | null; handle: string | null } {
      const videos = document.querySelectorAll<HTMLVideoElement>('video');
      if (!videos.length) return { videoId: null, handle: null };
  
      const viewportCenter = window.innerHeight / 2;
  
      let closest: HTMLVideoElement | null = null;
      let minDistance = Infinity;
  
      for (const video of videos) {
        const rect = video.getBoundingClientRect();
  
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
  
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - center);
  
        if (distance < minDistance) {
          minDistance = distance;
          closest = video;
        }
      }
  
      if (!closest) return { videoId: null, handle: null };
  
      const wrapper = closest.closest<HTMLElement>('[id^="xgwrapper-"]');
      const id = wrapper?.id.match(/(\d+)$/)?.[1] ?? null;
  
      const article = closest.closest<HTMLElement>(
        'article[data-e2e="recommend-list-item-container"]'
      );
  
      const avatarImg = article?.querySelector<HTMLImageElement>(
        '[data-e2e="video-author-avatar"] img'
      );
  
      const username = avatarImg?.alt?.trim() ?? null;
  
      return {
        videoId: id,
        handle: username ? `@${username}` : null,
      };
    }
  
    async function waitForVideoData(): Promise<{ videoId: string | null; handle: string | null }> {
      const retryDelay = 250;
  
      while (Date.now() - startTime < maxWaitMs) {
        const result = extractFromDom();
  
        if (result.videoId && result.handle) {
          return result;
        }
  
        await new Promise(res => setTimeout(res, retryDelay));
      }
  
      return extractFromDom();
    }
    

    if(!urlMatch) {
        const domData = await waitForVideoData();
        videoId = videoId ?? domData.videoId;
        handle = handle ?? domData.handle;
    }
  
    if (!videoId || !handle) {
      throw new Error('Could not reliably detect TikTok video info from DOM.');
    }
  
    const pageUrl = buildTikTokDetailPageUrl(handle, videoId);
    const html = await requestPageHtmlFromBackground(pageUrl);
  
    const info = buildTikTokFeedMediaInfoFromHtml(html, videoId);

    console.log(handle,videoId,"info");
  
    if (!info) {
      throw new Error('Could not parse TikTok video from the fetched page.');
    }
  
    return info;
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
