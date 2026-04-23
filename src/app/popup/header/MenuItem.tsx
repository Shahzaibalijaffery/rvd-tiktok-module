import type { LucideIcon } from 'lucide-react';
import { DropdownMenuItem } from '@/app/components/ui/dropdown-menu';

interface MenuItemProps {
    text: string;
    Icon: LucideIcon;
    onClick?: () => void;
}

function MenuItem({ onClick, Icon, text }: MenuItemProps) {
    return (
        <DropdownMenuItem
            className="hover:bg-tab-bg text-text-primary flex w-full cursor-pointer items-center gap-3 rounded-none px-4 py-3 transition-colors"
            onClick={onClick}
        >
            <Icon className="text-color-black h-4 w-4" />
            <span className="text-sm font-medium">{text}</span>
        </DropdownMenuItem>
    );
}

export default MenuItem;
