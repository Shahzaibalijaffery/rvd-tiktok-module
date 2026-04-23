import { ArrowUpDown, Grid3x3, List } from 'lucide-react';

import { useShallow } from 'zustand/react/shallow';
import FilterButton from '@/app/components/FilterButton';
import { useVideoStore } from '@/app/popup/video-store';
import { __t } from '@/system/lib/i18n';
import { cn } from '@/system/lib/utils';

interface Props {
    inline?: boolean;
}

export default function Filters({ inline = false }: Props) {
    const [viewMode, toggleSortOrder, toggleViewMode] = useVideoStore(useShallow(state => [
        state.viewMode,
        state.toggleSortOrder,
        state.toggleViewMode,
    ]));

    return (
        <div className={cn(
            'flex items-center',
            !inline && 'mb-4',
            'justify-end gap-3',
        )}
        >
            <div className="flex items-center gap-2">
                <FilterButton
                    size="icon"
                    Icon={ArrowUpDown}
                    tooltip={__t('filters_sort_by', 'Sort by size')}
                    side="bottom"
                    onClick={toggleSortOrder}
                />
            </div>

            <FilterButton
                size="icon"
                Icon={viewMode === 'grid' ? List : Grid3x3}
                tooltip={viewMode === 'grid' ? __t('filters_list_view', 'List view') : __t('filters_grid_view', 'Grid view')}
                side="bottom"
                onClick={toggleViewMode}
            />
        </div>
    );
}
