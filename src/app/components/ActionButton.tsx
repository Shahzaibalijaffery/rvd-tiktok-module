import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/system/lib/utils';

interface Props {
    text: string;
    Icon?: LucideIcon;
    loading?: boolean;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    iconClassName?: string;
}

function ActionButton({
    text,
    Icon,
    loading,
    className,
    onClick,
    disabled,
    iconClassName,
}: Props) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                'px-6 py-2.5 bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl font-medium flex items-center gap-2 border-2 border-primary transition-all hover:scale-105 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer ml-auto',
                className,
            )}
        >
            {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (
                        Icon && (
                            <Icon className={cn('h-4 w-4', iconClassName)} />
                        )
                    )}
            {text}
        </button>
    );
}

export default ActionButton;
