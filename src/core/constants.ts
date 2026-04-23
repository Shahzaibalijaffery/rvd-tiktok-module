import type { MessagePage } from '@/system/types';
import { MODULE_NAME } from '@/module-config';

/** Content script endpoint for module runtime messages (must match `MODULE_NAME`). */
export const CONTENT_MESSAGE_PAGE = `content/${MODULE_NAME}` as Extract<MessagePage, `content/${string}`>;
