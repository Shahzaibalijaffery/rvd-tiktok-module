import { initBackground } from '@/core/background/background';

void initBackground().catch((error) => {
    console.error('[RVD] initBackground failed', error);
});
