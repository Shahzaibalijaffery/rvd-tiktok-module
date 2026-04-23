import { X } from 'lucide-react';
import { useState } from 'react';

interface ProgressbarProps {
    percentage?: number;
    onClose?: () => void;
}

function ProgressBar({ percentage = 0, onClose }: ProgressbarProps) {
    const size = 48;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const [cross, setCross] = useState(false);

    return (
        <div
            className="relative flex items-center justify-center"
            onMouseEnter={() => setCross(true)}
            onMouseLeave={() => setCross(false)}
        >
            <svg className="-rotate-90 transform" width={size} height={size}>
                <circle
                    className="text-[#f2f2f2] dark:text-[#2a2a2a]"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-blue-500 transition-all duration-300"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>

            <div className="absolute text-[12px] text-black dark:text-white">
                {onClose && cross
                    ? (
                            <span
                                onClick={onClose}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[#e5e5e5] dark:hover:bg-[#4a4a4a]"
                            >
                                <X size={18} />
                            </span>
                        )
                    : (
                            <>
                                {percentage}
                                %
                            </>
                        )}
            </div>
        </div>
    );
}
export default ProgressBar;
