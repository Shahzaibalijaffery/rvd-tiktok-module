import type { Download, SingleInfo, Thumbnail } from '@/system/types';

type R = Record<string, unknown>;
const asR = (v: unknown): R | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as R) : null);

function parseHydration(html: string): unknown | null {
    const m = /<script\s+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!m?.[1]) return null;
    try {
        return JSON.parse(m[1].trim());
    }
    catch {
        return null;
    }
}

function rich(st: R): number {
    return (asR(st.video) ? 20 : 0) + (typeof st.desc === 'string' && st.desc.trim() ? 10 : 0)
        + (asR(st.author) ? 5 : 0) + (asR(st.music) ? 1 : 0);
}

/** Prefer `__DEFAULT_SCOPE__` → `webapp.video-detail` → `itemInfo.itemStruct`; else richest `itemStruct` with this id under the whole JSON. */
function itemStructFor(root: unknown, itemId: string): R | null {
    const want = String(itemId);
    const scope = asR((root as R).__DEFAULT_SCOPE__);
    let fromDetail: R | null = null;
    if (scope) {
        const det = asR(scope['webapp.video-detail'])
            ?? asR(scope[Object.keys(scope).find(k => /video-detail/i.test(k)) ?? ''] ?? null);
        const st = asR(asR(det?.itemInfo)?.itemStruct as unknown);
        if (st && String(st.id) === want) fromDetail = st;
    }

    let best: R | null = null;
    let bestR = -1;
    const q: unknown[] = [root];
    for (let i = 0; i < 400_000 && q.length; i++) {
        const cur = q.shift();
        if (!cur || typeof cur !== 'object') continue;
        if (Array.isArray(cur)) {
            q.push(...cur);
            continue;
        }
        const o = cur as R;
        if ('itemStruct' in o) {
            const st = asR(o.itemStruct);
            if (st && String(st.id) === want) {
                const r = rich(st);
                if (r > bestR) {
                    bestR = r;
                    best = st;
                }
            }
        }
        for (const v of Object.values(o))
            if (v && typeof v === 'object') q.push(v);
    }

    if (!fromDetail) return best;
    if (best && rich(best) > rich(fromDetail)) return best;
    return fromDetail;
}

function fmt(url: string): string {
    return url.includes('mime_type=audio_mpeg') ? 'mp3' : 'mp4';
}

function nBytes(v: unknown): number | undefined {
    if (typeof v === 'number' && v > 0 && Number.isFinite(v)) return Math.round(v);
    if (typeof v === 'string' && v.trim()) {
        const n = Number.parseInt(v.trim(), 10);
        if (n > 0 && Number.isFinite(n)) return n;
    }
    return undefined;
}

function rank(u: string): number {
    try {
        const h = new URL(u).hostname;
        if (h === 'www.tiktok.com' && u.includes('/aweme/v1/play')) return 0;
        const m = /^v(\d+)-/i.exec(h);
        if (m?.[1] != null) {
            const n = Number(m[1]);
            return n >= 17 ? 1 : n >= 10 ? 3 : 4;
        }
        if (/tiktokcdn\.com$/i.test(h)) return 2;
        if (/\.tiktok\.com$/i.test(h)) return 3;
    }
    catch { /* */ }
    return 5;
}

function pickUrl(urls: string[]): string | undefined {
    return urls.length ? [...urls].sort((a, b) => rank(a) - rank(b))[0] : undefined;
}

function videoCaption(video: R): string {
    const d = typeof video.definition === 'string' && video.definition.trim() ? video.definition.trim() : '';
    if (d) return d;
    const r = typeof video.ratio === 'string' && video.ratio.trim() ? video.ratio.trim() : '';
    if (r) return r;
    return 'Video';
}

/** Same resolution whether TikTok stores `720×1280` or `1280×720`. */
function canonResKey(w: number, h: number): string | null {
    if (w <= 0 || h <= 0) return null;
    const a = Math.min(w, h);
    const b = Math.max(w, h);
    return `${a}x${b}`;
}

function finalize(dl: Download[]): Download[] {
    let out = [...dl].sort((a, b) => rank(a.url) - rank(b.url));
    const px = new Map<string, Download>();
    const sc = (d: Download) =>
        (typeof d.filesize === 'number' && d.filesize > 0 ? d.filesize : 0) * 1e3 + (100 - rank(d.url));
    for (const d of out) {
        if (d.type !== 'AudioVideo' || !d.width || !d.height) continue;
        const k = canonResKey(d.width, d.height);
        if (!k) continue;
        const p = px.get(k);
        if (!p || sc(d) > sc(p)) px.set(k, d);
    }
    out = out.filter((d) => {
        if (d.type !== 'AudioVideo' || !d.width || !d.height) return true;
        const k = canonResKey(d.width, d.height);
        return !k || px.get(k) === d;
    });
    const seen = new Set<string>();
    return out.filter((d) => {
        if (seen.has(d.url)) return false;
        seen.add(d.url);
        return true;
    });
}

function titleOf(item: R, author: R | null, music: R | null): string {
    const d = typeof item.desc === 'string' ? item.desc.trim() : '';
    if (d) return d;
    const nick = author && typeof author.nickname === 'string' ? author.nickname.trim() : '';
    const uid = author && typeof author.uniqueId === 'string' ? author.uniqueId.trim() : '';
    if (nick && uid) return `${nick} (@${uid})`;
    if (nick) return nick;
    if (uid) return `@${uid}`;
    const s = music && typeof music.title === 'string' ? music.title.trim() : '';
    const m = music && typeof music.authorName === 'string' ? music.authorName.trim() : '';
    if (s && m) return `${s} — ${m}`;
    if (s) return s;
    return `TikTok ${item.id}`;
}

/** `/@…/video/{id}` HTML → {@link SingleInfo} (only fields read from hydration `itemStruct` / `video`). */
export function buildTikTokFeedMediaInfoFromHtml(html: string, itemId: string): SingleInfo | null {
    const root = parseHydration(html);
    if (!root) return null;

    const item = itemStructFor(root, itemId);
    if (!item || String(item.id) !== String(itemId)) return null;

    const video = asR(item.video);
    if (!video) return null;

    const author = asR(item.author);
    const music = asR(item.music);
    const ttl = titleOf(item, author, music);
    const desc = typeof item.desc === 'string' && item.desc.trim() ? item.desc.trim() : undefined;

    const dl: Download[] = [];
    let i = 0;
    const id = (p: string) => `${p}-${i++}`;

    const vw = +video.width! || 0;
    const vh = +video.height! || 0;
    const cap = videoCaption(video);
    const ps = asR(video.PlayAddrStruct ?? video.playAddrStruct);
    const vSz = nBytes(video.size);
    const pSz = ps ? nBytes(ps.DataSize ?? ps.dataSize) : undefined;
    /** Prefer play-struct byte size — `video.size` often does not match each CDN variant. */
    const streamBytes = pSz ?? vSz;

    const sw = ps ? +ps.Width! || +ps.width! || 0 : 0;
    const shp = ps ? +ps.Height! || +ps.height! || 0 : 0;
    /** Tag dimensions from the same object as the adaptive URLs (not only top-level `video`, which can disagree). */
    const tw = sw > 0 && shp > 0 ? sw : vw;
    const th = sw > 0 && shp > 0 ? shp : vh;

    const av = (p: string, url: string, q: string, w: number, h: number, ext: string, fs?: number) =>
        dl.push({ type: 'AudioVideo', id: id(p), title: ttl, quality: q, url, format: ext, width: w || undefined, height: h || undefined, filesize: fs });

    type Br = { pid: string; u: string; gear: string; w: number; h: number; ext: string; fs?: number };
    const bitrateRows: Br[] = [];
    const bi = video.bitrateInfo;
    if (Array.isArray(bi)) {
        for (const row of bi) {
            const r = asR(row);
            const p = r ? asR(r.PlayAddr ?? r.playAddr) : null;
            if (!r || !p) continue;
            const urls = Array.isArray(p.UrlList) ? (p.UrlList as unknown[]).filter((u): u is string => typeof u === 'string') : [];
            const u = pickUrl(urls);
            if (!u) continue;
            const w = +p.Width! || +p.width! || 0;
            const h = +p.Height! || +p.height! || 0;
            const gear = typeof r.GearName === 'string' && r.GearName.trim() ? r.GearName.trim() : 'Video';
            bitrateRows.push({
                pid: String(r.GearName ?? 's'),
                u,
                gear,
                w,
                h,
                ext: String(r.Format ?? 'mp4'),
                fs: nBytes(p.DataSize ?? p.dataSize) ?? vSz,
            });
        }
    }

    /** `playAddr` / struct URLs share top-level `DataSize` — it often disagrees with per-gear sizes in `bitrateInfo`, so list looks like 720p < 576p bytes. */
    const useBitrateLadder = bitrateRows.length > 0;

    if (!useBitrateLadder) {
        const pa = typeof video.playAddr === 'string' ? video.playAddr : '';
        if (pa) av('playAddr', pa, cap, tw, th, fmt(pa), streamBytes);

        const list = ps && Array.isArray(ps.UrlList) ? (ps.UrlList as unknown[]).filter((u): u is string => typeof u === 'string') : [];
        const pw = sw > 0 && shp > 0 ? sw : tw;
        const ph = sw > 0 && shp > 0 ? shp : th;
        for (const url of [...list].sort((a, b) => rank(a) - rank(b))) av('PlayAddrStruct', url, cap, pw, ph, fmt(url), streamBytes);
    }

    const da = typeof video.downloadAddr === 'string' ? video.downloadAddr : '';
    if (da) av('downloadAddr', da, 'Download', tw, th, fmt(da), streamBytes);

    if (music?.playUrl && typeof music.playUrl === 'string')
        dl.push({ type: 'AudioOnly', id: id('music'), title: ttl, quality: String(music.title ?? 'audio'), url: music.playUrl, format: fmt(music.playUrl) });

    for (const br of bitrateRows)
        av(br.pid, br.u, br.gear, br.w, br.h, br.ext, br.fs);

    const thumbs: Thumbnail[] = [];
    const cover = typeof video.cover === 'string' ? video.cover : '';
    if (cover) thumbs.push({ label: 'cover', url: cover });
    const z = asR(video.zoomCover);
    if (z) {
        for (const [lb, u] of Object.entries(z)) {
            if (typeof u === 'string' && u) thumbs.push({ label: `${lb}px`, url: u, width: +lb || undefined, height: +lb || undefined });
        }
    }

    const dur = +video.duration! || 0;

    return {
        type: 'single',
        id: String(item.id),
        title: ttl,
        length: Number.isFinite(dur) ? dur : 0,
        description: desc,
        author: author && typeof author.uniqueId === 'string' ? author.uniqueId : undefined,
        downloads: finalize(dl),
        thumbnailUrl: cover || undefined,
        thumbnails: thumbs.length ? thumbs : undefined,
    };
}
