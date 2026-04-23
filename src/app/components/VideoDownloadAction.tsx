import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/system/lib/utils';

interface Props {
    Icon: LucideIcon;
    selected?: boolean;
    /** Native `title` (browser tooltip on hover). */
    title: string;
    loading?: boolean;
    onClick?: () => void;
}

export default function VideoDownloadAction({
    Icon,
    selected,
    title: actionTitle,
    loading,
    onClick,
}: Props) {
    return (
        <button
            type="button"
            title={actionTitle}
            aria-label={actionTitle}
            onClick={onClick}
            className={cn(
                'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 transition-all hover:scale-105 focus:outline-none bg-bg text-text-primary hover:border-primary dark:bg-[#2f2f2f]',
                selected
                && 'border-primary bg-gradient-to-br from-primary to-primary/80 text-white hover:border-primary hover:text-white dark:border-primary',
            )}
        >
            {loading
                ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )
                : (
                        <Icon className="h-4 w-4" />
                    )}
        </button>
    );
}
