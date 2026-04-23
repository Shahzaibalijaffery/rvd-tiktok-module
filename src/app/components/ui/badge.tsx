import { cn } from '@/system/lib/utils';

function Badge({ text }: { text: string }) {
    return (
        <span className="bg-secondary rounded px-1.5 py-0.5 text-[10px] font-bold">
            {text}
        </span>
    );
}

export default Badge;

export function QualityBadge({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'px-2 py-0.5 text-xs font-bold rounded shrink-0 bg-black dark:bg-white text-white dark:text-black',
                className,
            )}
        >
            {text}
        </span>
    );
}
