import type { JsonRecord } from './tiktok-item-select';
import type { Download, SingleInfo, Thumbnail } from '@/system/types';

function asR(v: unknown): JsonRecord | null {
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonRecord) : null;
}

function fmt(url: string): string {
    return url.includes('mime_type=audio_mpeg') ? 'mp3' : 'mp4';
}

function nBytes(v: unknown): number | undefined {
    if (typeof v === 'number' && v > 0 && Number.isFinite(v))
        return Math.round(v);
    if (typeof v === 'string' && v.trim()) {
        const n = Number.parseInt(v.trim(), 10);
        if (n > 0 && Number.isFinite(n))
            return n;
    }
    return undefined;
}

function rank(u: string): number {
    try {
        const h = new URL(u).hostname;
        if (h === 'www.tiktok.com' && u.includes('/aweme/v1/play'))
            return 0;
        const m = /^v(\d+)-/i.exec(h);
        if (m?.[1] != null) {
            const n = Number(m[1]);
            return n >= 17 ? 1 : n >= 10 ? 3 : 4;
        }
        if (/tiktokcdn\.com$/i.test(h))
            return 2;
        if (/\.tiktok\.com$/i.test(h))
            return 3;
    }
    catch { /* */ }
    return 5;
}

function pickUrl(urls: string[]): string | undefined {
    return urls.length ? [...urls].sort((a, b) => rank(a) - rank(b))[0] : undefined;
}

function videoCaption(video: JsonRecord): string {
    const d = typeof video.definition === 'string' && video.definition.trim() ? video.definition.trim() : '';
    if (d)
        return d;
    const r = typeof video.ratio === 'string' && video.ratio.trim() ? video.ratio.trim() : '';
    if (r)
        return r;
    return 'Video';
}

function canonResKey(w: number, h: number): string | null {
    if (w <= 0 || h <= 0)
        return null;
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
        if (d.type !== 'AudioVideo' || !d.width || !d.height)
            continue;
        const k = canonResKey(d.width, d.height);
        if (!k)
            continue;
        const p = px.get(k);
        if (!p || sc(d) > sc(p))
            px.set(k, d);
    }
    out = out.filter((d) => {
        if (d.type !== 'AudioVideo' || !d.width || !d.height)
            return true;
        const k = canonResKey(d.width, d.height);
        return !k || px.get(k) === d;
    });
    const seen = new Set<string>();
    return out.filter((d) => {
        if (seen.has(d.url))
            return false;
        seen.add(d.url);
        return true;
    });
}

function titleOf(item: JsonRecord, author: JsonRecord | null, music: JsonRecord | null): string {
    const uid = author && typeof author.uniqueId === 'string' ? author.uniqueId.trim() : '';
    const handle = uid ? (uid.startsWith('@') ? uid : `@${uid}`) : '';
    const withHandle = (base: string): string => {
        if (!handle)
            return base;
        if (base.includes(handle))
            return base;
        return `${handle} - ${base}`;
    };

    const d = typeof item.desc === 'string' ? item.desc.trim() : '';
    if (d)
        return withHandle(d);

    const nick = author && typeof author.nickname === 'string' ? author.nickname.trim() : '';
    if (nick && uid)
        return withHandle(`${nick} (@${uid})`);
    if (nick)
        return withHandle(nick);
    if (uid)
        return withHandle(`@${uid}`);
    const s = music && typeof music.title === 'string' ? music.title.trim() : '';
    const m = music && typeof music.authorName === 'string' ? music.authorName.trim() : '';
    if (s && m)
        return withHandle(`${s} — ${m}`);
    if (s)
        return withHandle(s);
    return withHandle(`TikTok ${item.id}`);
}

export function buildSingleInfoFromItem(item: JsonRecord): SingleInfo | null {
    const video = asR(item.video);
    if (!video)
        return null;

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
    const streamBytes = pSz ?? vSz;

    const sw = ps ? +ps.Width! || +ps.width! || 0 : 0;
    const shp = ps ? +ps.Height! || +ps.height! || 0 : 0;
    const tw = sw > 0 && shp > 0 ? sw : vw;
    const th = sw > 0 && shp > 0 ? shp : vh;

    const av = (p: string, url: string, q: string, w: number, h: number, ext: string, fs?: number) =>
        dl.push({ type: 'AudioVideo', id: id(p), title: ttl, quality: q, url, format: ext, width: w || undefined, height: h || undefined, filesize: fs });

    interface Br { pid: string; u: string; gear: string; w: number; h: number; ext: string; fs?: number }
    const bitrateRows: Br[] = [];
    const bi = video.bitrateInfo;
    if (Array.isArray(bi)) {
        for (const row of bi) {
            const r = asR(row);
            const p = r ? asR(r.PlayAddr ?? r.playAddr) : null;
            if (!r || !p)
                continue;
            const urls = Array.isArray(p.UrlList) ? (p.UrlList as unknown[]).filter((u): u is string => typeof u === 'string') : [];
            const u = pickUrl(urls);
            if (!u)
                continue;
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

    if (!bitrateRows.length) {
        const pa = typeof video.playAddr === 'string' ? video.playAddr : '';
        if (pa)
            av('playAddr', pa, cap, tw, th, fmt(pa), streamBytes);

        const list = ps && Array.isArray(ps.UrlList) ? (ps.UrlList as unknown[]).filter((u): u is string => typeof u === 'string') : [];
        const pw = sw > 0 && shp > 0 ? sw : tw;
        const ph = sw > 0 && shp > 0 ? shp : th;
        for (const url of [...list].sort((a, b) => rank(a) - rank(b)))
            av('PlayAddrStruct', url, cap, pw, ph, fmt(url), streamBytes);
    }

    const da = typeof video.downloadAddr === 'string' ? video.downloadAddr : '';
    if (da)
        av('downloadAddr', da, 'Download', tw, th, fmt(da), streamBytes);

    if (music?.playUrl && typeof music.playUrl === 'string')
        dl.push({ type: 'AudioOnly', id: id('music'), title: ttl, quality: String(music.title ?? 'audio'), url: music.playUrl, format: fmt(music.playUrl) });

    for (const br of bitrateRows)
        av(br.pid, br.u, br.gear, br.w, br.h, br.ext, br.fs);

    const thumbs: Thumbnail[] = [];
    const cover = typeof video.cover === 'string' ? video.cover : '';
    if (cover)
        thumbs.push({ label: 'cover', url: cover });
    const z = asR(video.zoomCover);
    if (z) {
        for (const [lb, u] of Object.entries(z)) {
            if (typeof u === 'string' && u)
                thumbs.push({ label: `${lb}px`, url: u, width: +lb || undefined, height: +lb || undefined });
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
