import type { Download, QualityLabel } from '@/system/types';

/** Short-side (or lone non-zero side) in pixels — used for sort, `720p` caption, and tier when `videoQuality` is absent. */
export function downloadResolutionShortSide(d: Download): number {
    const w = d.width ?? 0;
    const h = d.height ?? 0;
    if (w <= 0 && h <= 0)
        return 0;
    if (w > 0 && h > 0)
        return Math.min(w, h);
    return Math.max(w, h);
}

/** When `videoQuality` is absent (e.g. TikTok HTML parse), infer tier from `width` / `height`. */
export function qualityLabelFromDownload(d: Download): QualityLabel {
    if (d.videoQuality?.label)
        return d.videoQuality.label;
    const n = downloadResolutionShortSide(d);
    if (!Number.isFinite(n) || n <= 0)
        return 'hd';
    if (n >= 2160)
        return '4k';
    if (n >= 1080)
        return '1080';
    if (n >= 720)
        return 'hd';
    return 'sd';
}

export function qualityBadgeText(label: QualityLabel): string {
    if (label === '1080')
        return 'HD';
    return label;
}

/** Secondary line: `720p` from dimensions, else caption string. */
export function downloadQualityCaption(d: Download): string {
    if (d.type === 'AudioOnly') {
        return d.quality.split(' · ')[0]?.trim() || d.quality;
    }
    const n = downloadResolutionShortSide(d);
    if (n > 0)
        return `${n}p`;
    return d.quality;
}
