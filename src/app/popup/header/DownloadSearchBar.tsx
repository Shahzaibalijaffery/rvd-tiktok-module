import { Search } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { useVideoStore } from '@/app/popup/video-store';
import { __t } from '@/system/lib/i18n';

export default function DownloadSearchBar() {
    const [query, setQuery] = useVideoStore(useShallow(state => [
        state.downloadSearchQuery,
        state.setDownloadSearchQuery,
    ]));

    const placeholder = __t(
        'popup_download_search_placeholder',
        'Filter by video title or author…',
    );

    return (
        <div className="relative mt-3">
            <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50"
                aria-hidden
            />
            <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-white/25 bg-white/15 py-2 pr-3 pl-9 text-sm text-white placeholder:text-white/55 focus:border-white/40 focus:bg-white/20 focus:outline-none"
            />
        </div>
    );
}
