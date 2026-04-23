import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import ActiveDownloadsPanel from './ActiveDownloads/ActiveDownloadsPanel';
import useDownloadsStore from './ActiveDownloads/downloads-store';

export default function ContentApp() {
    const downloads = useDownloadsStore(useShallow(state => state.downloads));

    useEffect(() => {
        useDownloadsStore.getState().init();
    }, []);

    return (
        <div className="rvd-tt-root fixed right-4 bottom-4 z-[2147483647]">
            {downloads.length > 0 && <ActiveDownloadsPanel />}
        </div>
    );
}
