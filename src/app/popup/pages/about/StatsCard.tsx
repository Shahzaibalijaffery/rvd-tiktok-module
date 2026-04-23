import type { LucideIcon } from 'lucide-react';
import { cn } from '@/system/lib/utils';

interface StatsCardProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    iconColor: string;
    bgColor: string;
}

export function StatsCard({
    icon: Icon,
    value,
    label,
    iconColor,
    bgColor,
}: StatsCardProps) {
    return (
        <div className="bg-background-promo border-promo-border rounded-xl border p-3">
            <div
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
                    bgColor,
                )}
            >
                <Icon className={cn('w-4 h-4', iconColor)} />
            </div>
            <p className="mb-1 text-2xl font-bold leading-none">{value}</p>
            <p className="text-text-secondary text-[10px] leading-none">{label}</p>
        </div>
    );
}
