import type { Message, MessageListener } from './types';
import { RUNTIME_MESSAGE_NAMESPACE } from '@/module-config';
import { isPromise } from './lib/utils';

export function onRuntimeMessage(listeners: { [name: string]: MessageListener }) {
    function hasListener<T extends Record<PropertyKey, unknown>>(obj: T, key: PropertyKey): key is keyof T {
        return key in obj;
    }

    chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
        const message = _message as Message;

        if (
            typeof message.namespace === 'undefined'
            || message.namespace !== RUNTIME_MESSAGE_NAMESPACE // Not our message, ignore
            || typeof message.name === 'undefined'
        ) {
            return;
        }

        const { name, data } = message;

        if (!hasListener(listeners, name)) { // No listener for this message name
            console.warn(`No listener for message namespace ${RUNTIME_MESSAGE_NAMESPACE} and name ${name}.`);
            return;
        }

        const listener = listeners[name]!;
        const response = listener(data, {
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
