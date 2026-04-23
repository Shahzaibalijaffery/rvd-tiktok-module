import { useState } from 'react';

interface YouTubeBadgeProps {
    isDarkMode?: boolean;
}

export function YouTubeBadge({ isDarkMode }: YouTubeBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span className="relative inline-flex">
            <span
                className="inline-flex cursor-help items-center rounded-md bg-[#FF0000] px-2 py-0.5 text-xs font-bold text-white"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                YouTube
            </span>
            {showTooltip && (
                <span
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg z-50 ${
                        isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-900 text-white'
                    }`}
                >
                    This setting only applies on youtube.com
                    <span
                        className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent ${
                            isDarkMode ? 'border-t-gray-800' : 'border-t-gray-900'
                        }`}
                    />
                </span>
            )}
        </span>
    );
}
