import type { Message, MessageListener, MessagePage, MessageResponse } from '@/system/types';
import { RUNTIME_MESSAGE_NAMESPACE } from '@/module-config';
import { isPromise } from './utils';

const TAB_SEND_RETRIES = 5;
const TAB_SEND_BASE_DELAY_MS = 120;
const RUNTIME_SEND_RETRIES = 4;
const RUNTIME_SEND_BASE_DELAY_MS = 80;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** MV3: content script may still be injecting; SW may be asleep — safe to retry a few times. */
function isRetriableSendError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Extension context invalidated')) {
        return false;
    }
    return (
        msg.includes('Receiving end does not exist')
        || msg.includes('Could not establish connection')
        || msg.includes('message port closed')
    );
}

async function sendMessageToTabWithRetry<Payload, Result>(
    tabId: number,
    message: Message<Payload>,
    options: chrome.tabs.MessageSendOptions,
): Promise<MessageResponse<Result>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < TAB_SEND_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                await sleep(TAB_SEND_BASE_DELAY_MS * attempt);
            }
            return await chrome.tabs.sendMessage<Message<Payload>, MessageResponse<Result>>(tabId, message, options);
        }
        catch (e) {
            lastError = e;
            if (!isRetriableSendError(e) || attempt === TAB_SEND_RETRIES - 1) {
                throw e;
            }
        }
    }
    throw lastError;
}

async function sendRuntimeMessageWithRetry<Payload, Result>(
    message: Message<Payload>,
): Promise<MessageResponse<Result>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < RUNTIME_SEND_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                await sleep(RUNTIME_SEND_BASE_DELAY_MS * attempt);
            }
            return await chrome.runtime.sendMessage<Message<Payload>, MessageResponse<Result>>(message);
        }
        catch (e) {
            lastError = e;
            if (!isRetriableSendError(e) || attempt === RUNTIME_SEND_RETRIES - 1) {
                throw e;
            }
        }
    }
    throw lastError;
}

export default class RuntimeMessage<P extends MessagePage, Target extends Exclude<MessagePage, P> = Exclude<MessagePage, P>> {
    static readonly NAMESPACE = RUNTIME_MESSAGE_NAMESPACE;

    private listeners: { [name: string]: MessageListener } = {};

    constructor(readonly page: P) {
        chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
            const message = _message as Message;

            if (
                typeof message.namespace === 'undefined'
                || message.namespace !== RuntimeMessage.NAMESPACE // Not our message, ignore
                || message.targetPage !== page // Check if message is not for this page
                || typeof message.name === 'undefined'
            ) {
                return;
            }

            const { name, data } = message;
            const callback = this.listeners[name];

            if (typeof callback === 'undefined') {
                console.warn(`No listener for message namespace ${RuntimeMessage.NAMESPACE} and name ${name}.`);
                return;
            }

            const response = callback(data, {
                sender,
                ok: data => ({ error: false, data }),
                fail: message => ({ error: true, message }),
            });

            if (isPromise(response)) {
                response.then(sendResponse);
                return true;
            }
            else {
                sendResponse(response);
            }
        });
    }

    on<T, U = void>(name: string, listener: MessageListener<T, U>): void {
        this.listeners[name] = listener;
    }

    send<Payload = unknown, Result = unknown>(
        targetPage: Target,
        name: string,
        data?: Payload,
        tabId?: number,
        frameId?: number,
    ): Promise<MessageResponse<Result>> {
        const message: Message<Payload> = {
            namespace: RuntimeMessage.NAMESPACE,
            targetPage,
            name,
            data,
        };

        if (typeof tabId !== 'undefined') {
            const options: chrome.tabs.MessageSendOptions = {};

            if (typeof frameId !== 'undefined') {
                options.frameId = frameId;
            }

            return sendMessageToTabWithRetry<Payload, Result>(tabId, message, options);
        }

        return sendRuntimeMessageWithRetry<Payload, Result>(message);
    }
}
