import type { StoreInstance } from '@/system/lib/Store';

import type { MessagePage } from '@/system/types';
import { DEFAULT_OPTIONS, DEFAULT_USER_DATA } from '@/core/config';
import RuntimeMessage from '@/system/lib/RuntimeMessage';
import Store from '@/system/lib/Store';

let runtimeMessage: RuntimeMessage<MessagePage> | undefined;

export function runtimeMessageInstance<T extends Exclude<MessagePage, 'background'>>(page: T): RuntimeMessage<T> {
    if (!runtimeMessage) {
        runtimeMessage = new RuntimeMessage(page);
    }

    return runtimeMessage as RuntimeMessage<T>;
}

export const options: StoreInstance<typeof DEFAULT_OPTIONS> = Store('__options__', DEFAULT_OPTIONS);
export const userData: StoreInstance<typeof DEFAULT_USER_DATA> = Store('__user_data__', DEFAULT_USER_DATA);
