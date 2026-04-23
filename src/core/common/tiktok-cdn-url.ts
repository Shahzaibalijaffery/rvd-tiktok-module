/** Hostnames that expect TikTok first-party / cookie context when fetched. */
export function isTikTokMediaDownloadSourceUrl(url: string): boolean {
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:' && u.protocol !== 'http:')
            return false;
        const h = u.hostname.toLowerCase();
        if (/\.tiktokcdn\.com$/i.test(h) || /\.tiktokcdn-[^.]+\.com$/i.test(h))
            return true;
        if (/\.tiktok\.com$/i.test(h))
            return true;
        if (/\.tiktokv\.com$/i.test(h))
            return true;
        if (/\.muscdn\.com$/i.test(h))
            return true;
        if (/ies-music/i.test(h) && /tiktok|byte/i.test(h))
            return true;
        return false;
    }
    catch {
        return false;
    }
}
