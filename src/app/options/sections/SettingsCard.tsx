import type { ReactNode } from 'react';

interface SettingsCardProps {
    title?: string | ReactNode;
    description?: string;
    children: ReactNode;
    isDarkMode: boolean;
    icon?: ReactNode;
    variant?: 'default' | 'warning';
    disabled?: boolean;
}

export function SettingsCard({
    title,
    description,
    children,
    isDarkMode,
    icon,
    variant = 'default',
    disabled,
}: SettingsCardProps) {
    const getCardStyles = () => {
        if (variant === 'warning') {
            return isDarkMode
                ? 'bg-red-950/10 border-red-900/50 hover:border-red-800'
                : 'bg-red-50/30 border-red-200 hover:border-red-300';
        }
        return isDarkMode
            ? 'bg-[#282828] border-[#3f3f3f] hover:border-[#5f5f5f]'
            : 'bg-white border-gray-200 hover:border-gray-300';
    };

    return (
        <div className={`rounded-xl border-2 p-4 sm:p-5 md:p-6 transition-all ${getCardStyles()}`}>
            {(title || icon) && (
                <div className={`mb-4 sm:mb-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    {icon && <div className="mb-3 flex items-center gap-2">{icon}</div>}
                    {title && (
                        <h3 className={`text-sm sm:text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {description}
                        </p>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
