// src/core/content-main-world/protocol.ts
export const RVD_TIKTOK_BRIDGE_SOURCE_ISO = '__rvd_tiktok_iso__' as const;
export const RVD_TIKTOK_BRIDGE_SOURCE_MAIN = '__rvd_tiktok_main__' as const;

export const RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER = 'fetch-buffer' as const;
export const RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD = 'blob-download' as const;
export const RVD_TIKTOK_BRIDGE_OP_FETCH_PAGE_HTML = 'fetch-page-html' as const;

export type TikTokBridgeOp =
    | typeof RVD_TIKTOK_BRIDGE_OP_FETCH_BUFFER
    | typeof RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD
    | typeof RVD_TIKTOK_BRIDGE_OP_FETCH_PAGE_HTML;