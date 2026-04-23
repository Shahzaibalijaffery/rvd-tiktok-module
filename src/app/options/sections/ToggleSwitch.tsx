interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    isDarkMode: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export function ToggleSwitch({
    checked,
    onChange,
    isDarkMode,
    label,
    description,
    disabled = false,
}: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between">
            {(label || description) && (
                <div>
                    {label && (
                        <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</h4>
                    )}
                    {description && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{description}</p>}
                </div>
            )}
            <button
                onClick={() => !disabled && onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    checked ? (isDarkMode ? 'bg-(--primary-600)' : 'bg-(--primary-600)') : isDarkMode ? 'bg-[#3f3f3f]' : 'bg-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-checked={checked}
                role="switch"
                disabled={disabled}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        checked ? 'translate-x-5' : ''
                    }`}
                />
            </button>
        </div>
    );
}
