/** Isolated world → main world `postMessage` bridge for TikTok blob downloads. */

export const RVD_TIKTOK_BLOB_MSG_SOURCE_ISO = '__rvd_tiktok_iso__' as const;
export const RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN = '__rvd_tiktok_main__' as const;
export const RVD_TIKTOK_BLOB_MSG_TYPE_REQUEST = 'rvd-tiktok-blob-request' as const;
export const RVD_TIKTOK_BLOB_MSG_TYPE_RESULT = 'rvd-tiktok-blob-result' as const;

/** Isolated → main world: fetch bytes (same credentials as page) for FFmpeg / buffers. */
export const RVD_TIKTOK_FETCH_BUF_MSG_TYPE_REQUEST = 'rvd-tiktok-fetch-buffer-request' as const;
export const RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT = 'rvd-tiktok-fetch-buffer-result' as const;
