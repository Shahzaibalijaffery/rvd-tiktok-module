import axios from 'axios';

const AXIOS_CONFIG = {
    adapter: 'fetch' as const,
    timeout: 20_000,
    responseType: 'text' as const,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
};

/** Service worker: GET TikTok video detail HTML (`fetch tiktok page html`). */
export async function fetchTiktokVideoDetailPageHtml(url: string): Promise<string> {
    const res = await axios.get<string>(url, AXIOS_CONFIG);
    return res.data;
}
