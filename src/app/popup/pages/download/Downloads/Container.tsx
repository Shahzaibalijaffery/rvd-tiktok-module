import { AlertCircle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import Loader from '@/app/components/Loader';
import MessageScreen from '@/app/components/MessageScreen';
import { useVideoStore } from '@/app/popup/video-store';

export default function Container({ children }: { children: React.ReactNode }) {
    const [fetching, error, info] = useVideoStore(useShallow(state => [
        state.fetching,
        state.error,
        state.info,
    ]));

    return fetching
        ? <Loader />
        : error
            ? <MessageScreen icon={AlertCircle} message={error} />
            : (!info
                    ? <MessageScreen icon={AlertCircle} message="Unable to load video information. Unknown error occurred." />
                    : <>{children}</>
                );
}
