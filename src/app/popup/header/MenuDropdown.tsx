import { HelpCircle, Moon, MoreVertical, Settings, Star, Sun } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { usePopupStore } from '@/app/popup/popup-store';
import MenuItem from './MenuItem';

function MenuDropdown() {
    const [theme, changeTheme, setActivePage] = usePopupStore(useShallow(state => [
        state.theme,
        state.changeTheme,
        state.setActivePage,
    ]));

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="focus:ring-white-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/30 focus:outline-none focus:ring-2">
                <MoreVertical className="h-4 w-4 text-white" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="animate-fadeIn bg-card-bg border-card-border z-50 mr-10 mt-2 w-52 overflow-hidden rounded-xl border p-0 shadow-lg sm:mr-[170px]">
                <MenuItem
                    Icon={HelpCircle}
                    text="Help"
                />

                <MenuItem
                    Icon={HelpCircle}
                    text="About"
                    onClick={() => setActivePage('about')}
                />

                <MenuItem
                    Icon={Star}
                    text="Rate Us"
                    onClick={() => setActivePage('rate-us')}
                />
                <DropdownMenuSeparator className="bg-card-border my-0" />

                <MenuItem
                    Icon={Settings}
                    text="Settings"
                />
                <DropdownMenuSeparator className="bg-card-border my-0" />

                <MenuItem
                    Icon={theme === 'dark' ? Sun : Moon}
                    text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    onClick={changeTheme}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default MenuDropdown;
