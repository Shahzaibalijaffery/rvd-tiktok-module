import type { LucideIcon } from 'lucide-react';
import { cn } from '@/system/lib/utils';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from './ui/tooltip';

interface FilterButtonProps {
    onClick?: () => void;
    text?: string;
    Icon: LucideIcon;
    tooltip: string;
    side: 'top' | 'bottom' | 'left' | 'right';
    size?: string;
    count?: number;
    showCount?: boolean;
}

function FilterButton({
    onClick,
    text,
    Icon,
    tooltip,
    side,
    size,
    count,
    showCount,
}: FilterButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors focus:outline-none  cursor-pointer bg-bg hover:bg-hover ',
                        size === 'icon' && 'p-2 block',
                    )}
                    onClick={onClick}
                >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{text}</span>
                    {showCount && typeof count !== 'undefined' && count > 0 && (
                        <span className="bg-color-black text-color-white flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold">
                            {count}
                        </span>
                    )}
                </button>
            </TooltipTrigger>

            <TooltipContent side={side}>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export default FilterButton;
