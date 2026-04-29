import type { Download } from '@/system/types';
import {
    downloadQualityCaption,
    qualityBadgeText,
    qualityLabelFromDownload,
} from '@/core/common/download-quality-tier';
import { downloadFile } from '@/core/common/functions';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import useDownloadsStore from './ActiveDownloads/downloads-store';
import { mediaInfoFromSnapshots } from './tiktok-page-info';

const BTN_CLASS = 'rvd-tt-feed-download-btn';
const WRAP_CLASS = 'rvd-tt-feed-download-wrap';
const MENU_CLASS = 'rvd-tt-feed-download-menu';
const STYLE_ID = 'rvd-tt-feed-download-style';
const RUN_DEBOUNCE_MS = 250;
const RUN_INTERVAL_MS = 2000;

/** White download glyph (SVG) — works in feed bar + dark dropdown; avoids invisible unicode on some fonts. */
const DOWNLOAD_ICON_SVG = '<svg width="34px" height="34px" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="1.2" transform="matrix(1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#ffffff"></path> <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#ffffff"></path> </g></svg>'



let runTimer: ReturnType<typeof setTimeout> | null = null;

function ensureButtonStyle(): void {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.${WRAP_CLASS}{position:relative}
.${MENU_CLASS}{position:absolute;right:100%;top:0;display:none;min-width:170px;background:#111827;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:6px;z-index:2147483647;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.${MENU_CLASS}.open{display:block}
.${MENU_CLASS} button.rvd-tt-feed-menu-row{display:flex;align-items:center;justify-content:flex-start;gap:10px;width:100%;border:0;background:transparent;color:#fff;padding:8px 10px;border-radius:8px;font:600 12px/1.2 sans-serif;cursor:pointer;text-align:left}
.${MENU_CLASS} button.rvd-tt-feed-menu-row:hover{background:rgba(255,255,255,.12)}
.${MENU_CLASS} button.rvd-tt-feed-menu-row:disabled{opacity:.65;cursor:default}
.${MENU_CLASS} .rvd-tt-feed-menu-icon{flex-shrink:0;display:inline-flex;color:#fff;line-height:0}
.${MENU_CLASS} .rvd-tt-feed-menu-icon .rvd-tt-feed-download-svg{display:block}
.${MENU_CLASS} .rvd-tt-feed-menu-label{flex:1;min-width:0}
.${MENU_CLASS} .rvd-tt-feed-menu-meta{opacity:.85;font-size:11px;font-weight:600;white-space:nowrap}
.${BTN_CLASS} .rvd-tt-feed-main-icon{display:inline-flex;color:#fff;line-height:0;align-items:center;justify-content:center}
.${BTN_CLASS} .rvd-tt-feed-main-icon .rvd-tt-feed-download-svg{display:block}
.${BTN_CLASS} strong{white-space:nowrap}
`;
    document.head.appendChild(style);
}

function feedArticles(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[id^="one-column-item-"]'));
}

function getVideoIdFromFeedArticle(article: HTMLElement): string | null {
    const wrapper = article.querySelector<HTMLElement>('[id^="xgwrapper-0-"]');
    const fromWrapper = wrapper?.id.match(/^xgwrapper-0-(\d+)$/)?.[1] ?? null;
    if (fromWrapper)
        return fromWrapper;
    const links = article.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]');
    for (const link of links) {
        const href = link.getAttribute('href') ?? '';
        const m = href.match(/\/video\/(\d+)/);
        if (m?.[1])
            return m[1];
    }
    return null;
}

function selectActionBar(article: HTMLElement): HTMLElement | null {
    const actionBar = article.querySelector<HTMLElement>('section[class*="ActionBarContainer"]');
    if (!actionBar)
        return null;
    if (actionBar.closest('[id^="one-column-item-"]') !== article)
        return null;
    return actionBar;
}

function mp3SourceFrom(downloads: Download[]): Download | null {
    const candidates = downloads.filter(d => d.type === 'AudioVideo' && (d.format === 'mp4' || d.format === 'm3u8'));
    if (!candidates.length)
        return null;
    const score = (d: Download): number => (typeof d.height === 'number' ? d.height : Number.MAX_SAFE_INTEGER);
    return [...candidates].sort((a, b) => score(a) - score(b))[0] ?? null;
}

/** Same ordering as popup list row line 2: format | {@link downloadQualityCaption} | tier badge (see DownloadItem.tsx). */
function popupStyleQualityLine(d: Download): string {
    const fmt = String(d.format).toUpperCase();
    const caption = downloadQualityCaption(d);
    const badge = qualityBadgeText(qualityLabelFromDownload(d));
    return [fmt, caption, badge].join(' · ');
}

function buildNativeLikeButton(actionBar: HTMLElement, videoId: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN_CLASS;
    btn.setAttribute('data-video-id', videoId);
    btn.setAttribute('aria-label', 'Download');

    const nativeBtn = actionBar.querySelector<HTMLButtonElement>('button[class*="ButtonActionItem"]');
    if (nativeBtn)
        btn.className = `${nativeBtn.className} ${BTN_CLASS}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'rvd-tt-feed-main-icon';
    iconSpan.innerHTML = DOWNLOAD_ICON_SVG;
    const nativeIcon = nativeBtn?.querySelector<HTMLElement>('span[class*="IconWrapper"]');
    if (nativeIcon)
        iconSpan.className = `${nativeIcon.className} rvd-tt-feed-main-icon`.trim();

    const label = document.createElement('strong');
    label.textContent = 'Download';
    const nativeLabel = nativeBtn?.querySelector<HTMLElement>('strong[class*="StrongText"]');
    if (nativeLabel)
        label.className = nativeLabel.className;

    btn.appendChild(iconSpan);
    btn.appendChild(label);
    return btn;
}

function closeMenu(menu: HTMLElement, onDocClick: (ev: MouseEvent) => void): void {
    menu.classList.remove('open');
    document.removeEventListener('click', onDocClick);
}

function openMenu(menu: HTMLElement, onDocClick: (ev: MouseEvent) => void): void {
    menu.classList.add('open');
    document.addEventListener('click', onDocClick);
}

function renderMenu(
    menu: HTMLElement,
    videoId: string,
    onDone: () => void,
): void {
    const info = mediaInfoFromSnapshots(videoId);
    menu.innerHTML = '';
    if (!info || info.type !== 'single') {
        const item = document.createElement('button');
        item.className = 'rvd-tt-feed-menu-row';
        item.disabled = true;
        item.innerHTML = `<span class="rvd-tt-feed-menu-icon">${DOWNLOAD_ICON_SVG}</span><span class="rvd-tt-feed-menu-label">Play video to load options</span>`;
        menu.appendChild(item);
        return;
    }

    const avDownloads = info.downloads.filter(d => d.type === 'AudioVideo');
    const seen = new Set<string>();
    const list = avDownloads.filter((d) => {
        if (seen.has(d.id))
            return false;
        seen.add(d.id);
        return true;
    });

    for (const d of list) {
        const item = document.createElement('button');
        item.className = 'rvd-tt-feed-menu-row';
        const line = popupStyleQualityLine(d);
        item.innerHTML = `<span class="rvd-tt-feed-menu-icon">${DOWNLOAD_ICON_SVG}</span><span class="rvd-tt-feed-menu-label">${escapeHtml(line)}</span>`;
        item.addEventListener('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onDone();
            if (d.format === 'm3u8') {
                useDownloadsStore.getState().addM3u8Download(d.url, d.title ?? info.title, d.quality, d.videoQuality?.label);
                return;
            }
            await downloadFile(CONTENT_MESSAGE_PAGE, d.url, {
                title: d.title ?? info.title,
                quality: d.quality,
                extension: d.format,
            });
        });
        menu.appendChild(item);
    }

    const mp3Source = mp3SourceFrom(info.downloads);
    if (mp3Source) {
        const mp3 = document.createElement('button');
        mp3.className = 'rvd-tt-feed-menu-row';
        mp3.innerHTML = `<span class="rvd-tt-feed-menu-icon">${DOWNLOAD_ICON_SVG}</span><span class="rvd-tt-feed-menu-label">MP3</span><span class="rvd-tt-feed-menu-meta">128kbps</span>`;
        mp3.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onDone();
            useDownloadsStore.getState().addM3u8Mp3Download(
                mp3Source.url,
                mp3Source.title ?? info.title,
                info.length,
                '128',
                null,
                null,
            );
        });
        menu.appendChild(mp3);
    }
}

function injectIntoActionBar(actionBar: HTMLElement, videoId: string): void {
    if (actionBar.querySelector(`.${WRAP_CLASS}[data-video-id="${videoId}"]`))
        return;

    const wrap = document.createElement('div');
    wrap.className = WRAP_CLASS;
    wrap.setAttribute('data-video-id', videoId);

    const menu = document.createElement('div');
    menu.className = MENU_CLASS;

    const onDocClick = (ev: MouseEvent) => {
        if (wrap.contains(ev.target as Node))
            return;
        closeMenu(menu, onDocClick);
    };

    const btn = buildNativeLikeButton(actionBar, videoId);
    btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (menu.classList.contains('open')) {
            closeMenu(menu, onDocClick);
            return;
        }
        renderMenu(menu, videoId, () => closeMenu(menu, onDocClick));
        openMenu(menu, onDocClick);
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    const second = actionBar.children[1];
    if (second)
        actionBar.insertBefore(wrap, second);
    else
        actionBar.appendChild(wrap);
}

function runInject(): void {
    ensureButtonStyle();
    for (const article of feedArticles()) {
        const videoId = getVideoIdFromFeedArticle(article);
        if (!videoId)
            continue;
        const actionBar = selectActionBar(article);
        if (!actionBar)
            continue;
        injectIntoActionBar(actionBar, videoId);
    }
}

function scheduleRun(): void {
    if (runTimer !== null)
        clearTimeout(runTimer);
    runTimer = setTimeout(() => {
        runTimer = null;
        runInject();
    }, RUN_DEBOUNCE_MS);
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function initTikTokFeedDownloadButtons(): void {
    if (window.self !== window.top)
        return;
    if (!/tiktok\.com$/i.test(location.hostname))
        return;

    runInject();
    const mo = new MutationObserver(() => scheduleRun());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.setInterval(runInject, RUN_INTERVAL_MS);
}

