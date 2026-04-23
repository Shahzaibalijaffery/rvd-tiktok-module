import { Check } from 'lucide-react';

interface CustomCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    id: string;
    isDarkMode: boolean;
}

export function CustomCheckbox({ checked, onChange, label, id, isDarkMode }: CustomCheckboxProps) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                id={id}
                onClick={() => onChange(!checked)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                    checked
                        ? isDarkMode
                            ? 'bg-(--primary-600) border-(--primary-600)'
                            : 'bg-(--primary-600) border-(--primary-600)'
                        : isDarkMode
                            ? 'bg-transparent border-[#3f3f3f] hover:border-[#5f5f5f]'
                            : 'bg-transparent border-gray-300 hover:border-gray-400'
                }`}
            >
                {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
            <label
                htmlFor={id}
                className={`text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                onClick={() => onChange(!checked)}
            >
                {label}
            </label>
        </div>
    );
}
