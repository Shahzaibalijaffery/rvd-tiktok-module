import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { options, userData } from '@/core/common/globals';
import baseStyles from './Base.css?inline';
import styles from './Content.css?inline';
import ContentApp from './ContentApp';
import { registerTikTokBlobDownloadBridge } from './tiktok-content-bridge';
import { registerPageVideoInfo } from './tiktok-page-info';

export function initContent(): void {
    let mounted = false;

    registerTikTokBlobDownloadBridge();
    registerPageVideoInfo();

    async function mount(): Promise<void> {
        if (mounted)
            return;

        mounted = true;

        const container = document.createElement('div');
        container.id = 'rvd-tt-content-root';

        const baseStyle = document.createElement('style');
        baseStyle.textContent = baseStyles;
        document.head.appendChild(baseStyle);

        const shadowRoot = container.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = styles;
        shadowRoot.appendChild(style);

        document.body.appendChild(container);

        await Promise.all([options.Ready, userData.Ready]);

        createRoot(shadowRoot).render(
            <StrictMode>
                <ContentApp />
            </StrictMode>,
        );
    }

    void mount();
}
