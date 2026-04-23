const RE_VIDEO_PATH = /@([^/]+)\/video\/(\d+)/i;
const RE_VIDEO_ID = /\/video\/(\d+)/;
const FEED_ITEM_SELECTORS = ['[id^="one-column-item-"]', '[data-e2e="recommend-list-item-container"]'] as const;
const XG_PREFIX = 'xgwrapper-0-';

function normalizeHandle(raw: string): string {
    return raw.replace(/^@/, '').trim();
}

function parseIdentityFromHrefString(href: string): { uniqueId: string; videoId: string } | null {
    const s = href.trim();
    if (!s) return null;

    try {
        const abs = s.startsWith('http') ? s : `https://www.tiktok.com${s.startsWith('/') ? '' : '/'}${s}`;
        const u = new URL(abs);
        const m = u.pathname.match(RE_VIDEO_PATH);
        const g1 = m?.[1];
        const g2 = m?.[2];
        if (g1 && g2) return { uniqueId: normalizeHandle(g1), videoId: g2.trim() };
    }
    catch {
        const m = s.match(RE_VIDEO_PATH);
        const g1 = m?.[1];
        const g2 = m?.[2];
        if (g1 && g2) return { uniqueId: normalizeHandle(g1), videoId: g2.trim() };
    }

    return null;
}

/** Fraction of `el`'s box that lies inside the viewport (0 = off-screen). */
function viewportVisibleRatio(el: Element): number {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 0;
    const iw = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const ih = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return (iw * ih) / (r.width * r.height);
}

/** Pixel area of the intersection of `el` with the viewport. */
function visibleIntersectionArea(el: Element): number {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 0;
    const iw = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const ih = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return iw * ih;
}

function feedArticles(): Element[] {
    const seen = new Set<Element>();
    const list: Element[] = [];
    for (const sel of FEED_ITEM_SELECTORS) {
        document.querySelectorAll<Element>(sel).forEach((el) => {
            if (!seen.has(el)) {
                seen.add(el);
                list.push(el);
            }
        });
    }
    return list;
}

function videoIdFromArticle(article: Element): string | null {
    const w = article.querySelector(`[id^="${XG_PREFIX}"]`);
    if (w?.id?.startsWith(XG_PREFIX)) {
        const id = w.id.slice(XG_PREFIX.length);
        if (/^\d+$/.test(id)) return id;
    }
    for (const a of article.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]')) {
        const m = (a.getAttribute('href') || '').match(RE_VIDEO_ID);
        if (m?.[1]) return m[1];
    }
    return null;
}

/** Author + id from links inside one feed / list item. */
function identityFromFeedArticle(article: Element): { uniqueId: string; videoId: string } | null {
    const vid = videoIdFromArticle(article);
    if (!vid) return null;

    for (const a of article.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]')) {
        const p = parseIdentityFromHrefString(a.getAttribute('href') || '');
        if (p?.videoId === vid) return p;
    }

    const handleRe = /^\/@([^/]+)/i;
    for (const a of article.querySelectorAll<HTMLAnchorElement>('a[href^="/@"]')) {
        const href = a.getAttribute('href') || '';
        const mh = href.match(handleRe);
        if (mh?.[1] && !href.includes('/video/'))
            return { uniqueId: normalizeHandle(mh[1]), videoId: vid };
    }

    return null;
}

/** Visible `a[href*="/video/"]` with largest on-screen area (e.g. detail page caption link). */
function identityFromVisibleVideoAnchors(): { uniqueId: string; videoId: string } | null {
    let best: { uniqueId: string; videoId: string; area: number } | null = null;
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]')) {
        const area = visibleIntersectionArea(a);
        if (area <= 0) continue;
        const p = parseIdentityFromHrefString(a.getAttribute('href') || '');
        if (!p) continue;
        if (!best || area > best.area) best = { ...p, area };
    }
    return best ? { uniqueId: best.uniqueId, videoId: best.videoId } : null;
}

/**
 * Feed rows that intersect the viewport, most visible first; then any on-screen `/video/` link.
 */
export function resolveTikTokPageVideoIdentity(): { uniqueId: string; videoId: string } | null {
    const ranked = feedArticles()
        .map(el => ({ el, r: viewportVisibleRatio(el) }))
        .filter(x => x.r > 0)
        .sort((a, b) => b.r - a.r);

    for (const { el } of ranked) {
        const id = identityFromFeedArticle(el);
        if (id) return id;
    }

    return identityFromVisibleVideoAnchors();
}

export function isTikTokWebDocument(): boolean {
    return /tiktok\.com$/i.test(location.hostname);
}
