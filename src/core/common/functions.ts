import type { MessagePage } from '@/system/types';

import filenamify from 'filenamify';

import { options, runtimeMessageInstance } from './globals';

/**
 * Chromium uses `net::IsSafePortableRelativePath` — non-ASCII titles often fail on Windows;
 * we emit ASCII-only relative paths. See chrome.downloads.download filename rules.
 */
const KNOWN_DOWNLOAD_EXT = /\.(?:mp4|mp3|mpd|m3u8|webm|mkv|m4v|mov|jpg|jpeg|png|gif|webp|aac|wav|json)$/i;

const CHROME_RELATIVE_MAX = 200;

const WIN_RESERVED_BASE = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

const RE_LEADING_SLASHES = /^[/\\]+/g;
const RE_DOT_DOT = /\.\./g;
const RE_LEADING_DOT = /^\./;
const RE_HINT_CLEAN = /[^a-z0-9]/gi;
const RE_COMBINING_MARKS = /[\u0300-\u036F]/g;
const RE_NON_ASCII_PRINT = /[^\x20-\x7E]/g;
/** C0 controls + characters invalid in portable download paths */
// eslint-disable-next-line no-control-regex -- strip U+0000–U+001F intentionally
const RE_FILENAME_BAD_CHARS = /[\u0000-\u001F<>:"|?*]/g;
const RE_BACKSLASH = /\\/g;
const RE_SLASH = /\//g;
const RE_MULTI_HYPHEN = /-+/g;
const RE_TRIM_EDGE = /^[.\s_-]+|[.\s_-]+$/g;
const RE_ONLY_DOTS = /^\.+$/;
const RE_PATH_SPLIT = /[/\\]/g;
const RE_TRAILING_DOT_SPACE = /[. ]+$/g;
const RE_EXT_RAW_CLEAN = /[^\w.+-]/g;
const RE_WS_COLLAPSE = /\s{2,}/g;
const RE_TILDE = /~/g;
// eslint-disable-next-line no-control-regex
const RE_QUALITY_SANITIZE = /[\u0000-\u001F<>:"/\\|?*]/g;
const RE_REMOVE_SPECIAL_FILENAME = /[<>:"/|?*\]]/g;

function extensionFromNameOrHint(full: string, hint: string): { base: string; ext: string } {
    const m = full.match(KNOWN_DOWNLOAD_EXT);
    if (m?.[0]) {
        return {
            base: full.slice(0, -m[0].length),
            ext: m[0],
        };
    }
    const clean = hint.replace(RE_LEADING_DOT, '').replace(RE_HINT_CLEAN, '').toLowerCase() || 'mp4';

    return { base: full, ext: `.${clean}` };
}

function toChromePortableRelativeFilename(full: string, extHint: string): string {
    const s = full
        .replace(RE_LEADING_SLASHES, '')
        .replace(RE_DOT_DOT, '-')
        .trim();

    const { base: rawBase, ext } = extensionFromNameOrHint(s, extHint);

    let base = rawBase
        .normalize('NFKD')
        .replace(RE_COMBINING_MARKS, '')
        .replace(RE_NON_ASCII_PRINT, '_')
        .replace(RE_FILENAME_BAD_CHARS, '-')
        .replace(RE_BACKSLASH, '-')
        .replace(RE_SLASH, '-')
        .replace(RE_DOT_DOT, '-')
        .replace(RE_MULTI_HYPHEN, '-')
        .replace(RE_TRIM_EDGE, '')
        .trim();

    if (!base || RE_ONLY_DOTS.test(base))
        base = 'video';

    const lastSeg = (base.split(RE_PATH_SPLIT).pop() ?? base);
    const nameOnly = lastSeg.includes('.') ? lastSeg.slice(0, lastSeg.lastIndexOf('.')) : lastSeg;
    if (WIN_RESERVED_BASE.test(nameOnly) || WIN_RESERVED_BASE.test(lastSeg))
        base = `_${base}`;

    let out = `${base}${ext}`;
    out = out.replace(RE_TRAILING_DOT_SPACE, '');
    out = out.replace(RE_NON_ASCII_PRINT, '_');

    if (out.length > CHROME_RELATIVE_MAX) {
        const keep = Math.max(1, CHROME_RELATIVE_MAX - ext.length);
        out = base.slice(0, keep) + ext;
    }

    if (!out || out === '.' || out === '..')
        out = `video${ext}`;

    return out;
}

async function buildFilenameBase(title: string, quality: string): Promise<string> {
    await options.Ready;

    let filename: string = filenamify(title).replace(RE_TILDE, '').trim();

    options.filenamePattern.forEach((key) => {
        if (key === 'source-website')
            filename = `${filename}-tiktok`;
        if (key === 'quality')
            filename = `${filename}-${String(quality).replace(RE_QUALITY_SANITIZE, '-')}`;

        if (key === 'date') {
            const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            filename = `${filename}-${date}`;
        }

        if (key === 'time') {
            const time = new Date().toLocaleTimeString('en-GB').replace(/:/g, '-');
            filename = `${filename}-${time}`;
        }
    });

    if (options.filenameCaseManagement === 'lowercase') {
        filename = filename.toLowerCase();
    }
    else if (options.filenameCaseManagement === 'uppercase') {
        filename = filename.toUpperCase();
    }

    if (options.limitFilenameCharacters) {
        filename = filename.slice(0, options.filenameCharacterLimit);
    }

    if (options.removeSpecialCharacters) {
        filename = filename
            .replace(RE_REMOVE_SPECIAL_FILENAME, options.replaceSpecialCharactersWith)
            .replace(RE_WS_COLLAPSE, ' ');
    }

    return filename.trim();
}

type FilenameOptions = {
    title: string;
    quality: string;
    extension?: string;
} | {
    filename: string;
};

/**
 * @param page Runtime sender page namespace.
 * @param url Source media URL.
 * @param filenameOptions Optional filename construction options.
 * @param targetTabId Tab where TikTok runs — required for main-world blob downloads from the popup
 *        (content-script sends can omit; background uses `sender.tab`).
 */
export async function downloadFile(
    page: Exclude<MessagePage, 'background'>,
    url: string,
    filenameOptions?: FilenameOptions,
    targetTabId?: number,
) {
    await options.Ready;

    let filename: string | undefined;

    if (filenameOptions) {
        if ('filename' in filenameOptions) {
            const raw = filenamify(filenameOptions.filename).replace(RE_TILDE, '').trim();
            const hint = (raw.match(KNOWN_DOWNLOAD_EXT)?.[0] ?? '.jpg').replace(RE_LEADING_DOT, '') || 'jpg';
            filename = toChromePortableRelativeFilename(raw, hint);
        }
        else {
            const { title, quality, extension } = filenameOptions;
            const base = await buildFilenameBase(title, quality);
            const extRaw = (extension ?? 'mp4').replace(RE_EXT_RAW_CLEAN, '') || 'mp4';
            filename = toChromePortableRelativeFilename(`${base}.${extRaw}`, extRaw);
        }
    }

    const response = await runtimeMessageInstance(page).send('background', 'download', {
        url,
        filename,
        saveAs: options.saveAsDialogEnabled,
        conflictAction: options.filenameOnConflict,
        tabId: targetTabId,
    });

    if (response.error)
        throw new Error(response.message);
}
