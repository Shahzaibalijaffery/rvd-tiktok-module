interface CustomRangeSliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    isDarkMode: boolean;
}

export function CustomRangeSlider({ value, onChange, min, max, isDarkMode }: CustomRangeSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative">
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="focus:ring-(--primary-500) h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                    background: isDarkMode
                        ? `linear-gradient(
                            to right,
                            var(--primary-600) 0%,
                            var(--primary-600) ${percentage}%,
                            var(--primary-800) ${percentage}%,
                            var(--primary-800) 100%
                        )`
                        : `linear-gradient(
                            to right,
                            var(--primary-600) 0%,
                            var(--primary-600) ${percentage}%,
                            var(--primary-200) ${percentage}%,
                            var(--primary-200) 100%
                        )`,
                }}
            />
            <style>
                {`
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--primary-600);
            cursor: pointer;
            border: 3px solid ${isDarkMode ? 'var(--primary-900)' : '#ffffff'};
        }
        input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--primary-600);
            cursor: pointer;
            border: 3px solid ${isDarkMode ? 'var(--primary-900)' : '#ffffff'};
        }
        `}
            </style>
        </div>
    );
}
