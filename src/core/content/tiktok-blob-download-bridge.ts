// src/core/content/tiktok-blob-download-bridge.ts
import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import type { TikTokBlobDownloadPayload } from '@/core/content-main-world/tiktok-blob-download';
import type { MessageResponse } from '@/system/types';

import { RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD } from '@/core/content-main-world/protocol';
import useDownloadsStore from './ActiveDownloads/downloads-store';
import { callTikTokMainWorld } from './tiktok-main-world-bridge-client';

const BLOB_DOWNLOAD_TIMEOUT_MS = 610_000;

/** Bridges background -> isolated content -> main world via shared bridge client. */
export function registerTikTokBlobDownloadBridge(): void {
    const runtimeMessage = runtimeMessageInstance(CONTENT_MESSAGE_PAGE);

    runtimeMessage.on<TikTokBlobDownloadPayload, { ok: true }>(
        'tikTok blob download',
        async (data, { ok, fail }): Promise<MessageResponse<{ ok: true }>> => {
            if (!/tiktok\.com/i.test(location.hostname)) {
                return fail('Keep this tab on TikTok to download.');
            }

            const rowUuid = useDownloadsStore.getState().beginTikTokBlobDownload(data.baseName);
            const { updateStatus } = useDownloadsStore.getState();

            try {
                await callTikTokMainWorld<TikTokBlobDownloadPayload, { ok: true }>(
                    RVD_TIKTOK_BRIDGE_OP_BLOB_DOWNLOAD,
                    data,
                    { timeoutMs: BLOB_DOWNLOAD_TIMEOUT_MS },
                );

                updateStatus(rowUuid, { state: 'complete' });
                return ok({ ok: true });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                updateStatus(rowUuid, { state: 'failed', message });
                return fail(message);
            }
        },
    );
}