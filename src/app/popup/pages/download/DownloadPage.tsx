import type { JSX } from 'react';

import type { DownloadTab } from '@/app/popup/popup-store';
import { useShallow } from 'zustand/react/shallow';
import { Tabs, TabsContent } from '@/app/components/ui/tabs';
import { usePopupStore } from '@/app/popup/popup-store';
import { useVideoStore } from '@/app/popup/video-store';
import Container from './Downloads/Container';
import Mp3Converter from './Downloads/Mp3Converter';
import ThumbnailsDownload from './Downloads/Thumbnails';
import VideoDownloads from './Downloads/Video/Downloads';
import TabsNavigation from './TabNavigation';

export default function DownloadPage() {
    const [activeDownloadTab, setActiveDownloadTab] = usePopupStore(useShallow(state => [
        state.activeDownloadTab,
        state.setActiveDownloadTab,
    ]));
    const [fetching] = useVideoStore(useShallow(state => [
        state.fetching,
    ]));

    const tabsContent: { [key in DownloadTab]?: {
        skipContainer?: boolean;
        content: () => JSX.Element | null;
    } } = {
        video: { content: VideoDownloads },
        audio: { content: Mp3Converter },
        thumbnails: { content: ThumbnailsDownload },
    };

    return (
        <Tabs value={activeDownloadTab} onValueChange={value => setActiveDownloadTab(value as DownloadTab)} className="gap-0">
            <TabsNavigation disabled={fetching} />

            {Object.entries(tabsContent).map(([id, { content: Content, skipContainer }]) => (
                <TabsContent
                    key={id}
                    value={id}
                    className="animate-in fade-in-0 flex-1 overflow-y-auto p-5 outline-none duration-500"
                >
                    {skipContainer
                        ? <Content />
                        : (
                                <Container>
                                    <Content />
                                </Container>
                            )}
                </TabsContent>
            ))}
        </Tabs>
    );
}
