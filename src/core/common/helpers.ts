export function urlMatchesTikTok(url: string): boolean {
    try {
        const u = new URL(url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:')
            return false;

        return /tiktok\.com$/i.test(u.hostname);
    }
    catch {
        return false;
    }
}

export async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    return tab ?? null;
}

export function formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return bytes === 0 ? '0B' : `${Number.parseFloat((bytes / (1024 ** i)).toFixed(1))}${sizes[i]}`;
}
