import { runtimeMessageInstance } from '@/core/common/globals';
import { CONTENT_MESSAGE_PAGE } from '@/core/constants';
import type { TikTokBlobDownloadPayload } from '@/core/content-main-world/tiktok-blob-download';
import type { MessageResponse } from '@/system/types';

import useDownloadsStore from './ActiveDownloads/downloads-store';
import {
    RVD_TIKTOK_BLOB_MSG_SOURCE_ISO,
    RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
    RVD_TIKTOK_BLOB_MSG_TYPE_REQUEST,
    RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
} from '@/core/content-main-world/protocol';

const BLOB_DOWNLOAD_TIMEOUT_MS = 610_000;

/** Bridges background → isolated content → main world (`content-main-world.js`) via `postMessage`. */
export function registerTikTokBlobDownloadBridge(): void {
    const runtimeMessage = runtimeMessageInstance(CONTENT_MESSAGE_PAGE);

    runtimeMessage.on<TikTokBlobDownloadPayload, { ok: true }>(
        'tikTok blob download',
        (data, { ok, fail }): Promise<MessageResponse<{ ok: true }>> => {
            if (!/tiktok\.com/i.test(location.hostname))
                return Promise.resolve(fail('Keep this tab on TikTok to download.'));

            const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

            return new Promise<MessageResponse<{ ok: true }>>((resolve) => {
                let settled = false;
                const rowUuid = useDownloadsStore.getState().beginTikTokBlobDownload(data.baseName);
                const { updateStatus } = useDownloadsStore.getState();

                const finish = (out: MessageResponse<{ ok: true }>) => {
                    if (settled)
                        return;
                    settled = true;
                    window.removeEventListener('message', onReply);
                    window.clearTimeout(timer);
                    resolve(out);
                };

                const onReply = (ev: MessageEvent) => {
                    if (ev.source !== window)
                        return;

                    const d = ev.data;

                    if (
                        d?.source !== RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN
                        || d?.type !== RVD_TIKTOK_BLOB_MSG_TYPE_RESULT
                        || d.token !== token
                    ) {
                        return;
                    }

                    if (d.ok === true) {
                        updateStatus(rowUuid, { state: 'complete' });
                        finish(ok({ ok: true }));
                    }
                    else {
                        updateStatus(rowUuid, {
                            state: 'failed',
                            message: typeof d.errorMessage === 'string' ? d.errorMessage : 'TikTok download failed.',
                        });
                        finish(fail(typeof d.errorMessage === 'string' ? d.errorMessage : 'TikTok download failed.'));
                    }
                };

                window.addEventListener('message', onReply);

                const timer = window.setTimeout(() => {
                    updateStatus(rowUuid, { state: 'failed', message: 'TikTok download timed out.' });
                    finish(fail('TikTok download timed out.'));
                }, BLOB_DOWNLOAD_TIMEOUT_MS);

                window.postMessage(
                    {
                        source: RVD_TIKTOK_BLOB_MSG_SOURCE_ISO,
                        type: RVD_TIKTOK_BLOB_MSG_TYPE_REQUEST,
                        token,
                        payload: data,
                    },
                    '*',
                );
            });
        },
    );
}
