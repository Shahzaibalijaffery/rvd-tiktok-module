interface CustomInputProps {
    type?: string;
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    isDarkMode: boolean;
    className?: string;
}

export function CustomInput({
    type = 'text',
    value,
    onChange,
    placeholder,
    isDarkMode,
    className = '',
}: CustomInputProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-(--primary-500) focus:ring-offset-2 cursor-text ${
                isDarkMode
                    ? 'bg-[#1a1a1a] border-[#3f3f3f] text-white placeholder-gray-500 hover:border-[#5f5f5f] focus:ring-offset-[#0f0f0f]'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:ring-offset-white'
            } ${className}`}
        />
    );
}
