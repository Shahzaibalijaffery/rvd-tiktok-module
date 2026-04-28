import type { SingleInfo } from '@/system/types';
import { buildSingleInfoFromItem } from './tiktok-single-info-builder';

export type JsonRecord = Record<string, unknown>;

function asR(v: unknown): JsonRecord | null {
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonRecord) : null;
}

function rich(st: JsonRecord): number {
    return (asR(st.video) ? 20 : 0) + (typeof st.desc === 'string' && st.desc.trim() ? 10 : 0)
        + (asR(st.author) ? 5 : 0) + (asR(st.music) ? 1 : 0);
}

function defaultScope(root: unknown): JsonRecord | null {
    return asR(asR(root)?.__DEFAULT_SCOPE__);
}

function detailItemStruct(scope: JsonRecord | null): JsonRecord | null {
    if (!scope)
        return null;
    const detailKey = Object.keys(scope).find(k => k === 'webapp.video-detail' || /video-detail/i.test(k));
    if (!detailKey)
        return null;
    const detail = asR(scope[detailKey]);
    return asR(asR(detail?.itemInfo)?.itemStruct);
}

function bestItemStruct(root: unknown, predicate: (st: JsonRecord) => boolean): JsonRecord | null {
    let best: JsonRecord | null = null;
    let bestR = -1;
    const q: unknown[] = [root];
    for (let i = 0; i < 400_000 && q.length; i++) {
        const cur = q.shift();
        if (!cur || typeof cur !== 'object')
            continue;
        if (Array.isArray(cur)) {
            q.push(...cur);
            continue;
        }
        const o = cur as JsonRecord;
        const st = asR(o.itemStruct);
        if (st && predicate(st)) {
            const r = rich(st);
            if (r > bestR) {
                bestR = r;
                best = st;
            }
        }
        for (const v of Object.values(o)) {
            if (v && typeof v === 'object')
                q.push(v);
        }
    }
    return best;
}

function updatedItemsFromHydration(root: unknown): JsonRecord[] {
    const list = defaultScope(root)?.['webapp.updated-items'];
    if (!Array.isArray(list))
        return [];
    return list.map(asR).filter((item): item is JsonRecord => Boolean(item?.video));
}

function updatedItemFor(root: unknown, itemId?: string): JsonRecord | null {
    const items = updatedItemsFromHydration(root);
    if (!items.length)
        return null;
    if (itemId) {
        const hit = items.find(it => String(it.id ?? '') === String(itemId));
        return hit ?? null;
    }
    return items[0] ?? null;
}

export function selectItemFromHydration(root: unknown, itemId?: string): JsonRecord | null {
    const itemFromStruct = itemId
        ? (() => {
                const want = String(itemId);
                const fromDetail = detailItemStruct(defaultScope(root));
                const best = bestItemStruct(root, st => String(st.id) === want);
                if (!fromDetail || String(fromDetail.id) !== want)
                    return best;
                if (best && rich(best) > rich(fromDetail))
                    return best;
                return fromDetail;
            })()
        : (() => {
                const fromDetail = detailItemStruct(defaultScope(root));
                if (fromDetail?.video)
                    return fromDetail;
                return bestItemStruct(root, st => Boolean(st.video));
            })();

    const item = itemFromStruct ?? updatedItemFor(root, itemId);
    if (!item)
        return null;
    if (itemId && String(item.id) !== String(itemId))
        return null;
    return item;
}

export function selectItemFromApiResponse(root: unknown, itemId?: string): JsonRecord | null {
    const r = asR(root);
    if (!r)
        return null;

    const candidates = [
        r.itemList,
        r.item_list,
        asR(r.data)?.itemList,
        asR(r.data)?.item_list,
        asR(r.data)?.aweme_list,
    ];

    for (const c of candidates) {
        if (!Array.isArray(c))
            continue;

        if (itemId) {
            const hit = c.find((it) => {
                const ir = asR(it);
                return ir && String(ir.id ?? ir.aweme_id ?? '') === String(itemId);
            });
            if (hit) {
                const hr = asR(hit);
                if (hr)
                    return hr;
            }
            continue;
        }

        for (const it of c) {
            const ir = asR(it);
            if (ir?.video)
                return ir;
        }
    }

    return null;
}

function parseHydration(html: string): unknown | null {
    const m = /<script\s+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!m?.[1])
        return null;
    try {
        return JSON.parse(m[1].trim());
    }
    catch {
        return null;
    }
}

/** `/@…/video/{id}` HTML → {@link SingleInfo} (only fields read from hydration payload). */
export function buildTikTokFeedMediaInfoFromHtml(html: string, itemId?: string): SingleInfo | null {
    const root = parseHydration(html);
    if (!root)
        return null;
    const item = selectItemFromHydration(root, itemId);
    if (!item)
        return null;
    return buildSingleInfoFromItem(item);
}

/** TikTok feed/detail API JSON (`itemList` / `item_list` / `aweme_list`) → {@link SingleInfo}. */
export function buildTikTokFeedMediaInfoFromApiResponse(responseJson: unknown, itemId?: string): SingleInfo | null {
    const item = selectItemFromApiResponse(responseJson, itemId);
    if (!item)
        return null;
    return buildSingleInfoFromItem(item);
}
