import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/system/lib/utils';
import { QualityBadge } from './ui/badge';

interface CustomSelectProps {
    options: { value: string; label?: string; badge?: string }[];
    value: string;
    heading?: string;
    searchable?: boolean;
    position?: 'top' | 'bottom';
    onChange: (value: string) => void;
}

export default function CustomSelect({ options, heading, searchable, value, position = 'bottom', onChange }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Get the label for the selected value
    const selectedOption = useMemo(() => options.find(opt => opt.value === value), [value]);

    const filteredOptions = useMemo(() => {
        if (!searchable || query.trim() === '') {
            return options;
        }

        const lowerQuery = query.toLowerCase();
        return options.filter(opt => (opt.label ?? opt.value).toLowerCase().includes(lowerQuery));
    }, [options, query, searchable]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const path = event.composedPath(); // Fix for Shadow DOM compatibility

            if (
                dropdownRef.current
                && !path.includes(dropdownRef.current)
            ) {
                setIsOpen(false);
            }
        }

        // Close on ESC key
        function handleEscKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        buttonRef.current?.focus();
        setQuery('');
    };

    return (
        <div ref={dropdownRef}>
            {heading && <label className="mb-2 block text-sm font-semibold">{heading}</label>}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        `w-full px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg border transition-all duration-200 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-(--primary-500) focus:ring-offset-2`,
                        'bg-white border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50 focus:ring-offset-white',
                        'dark:bg-[#1a1a1a] dark:border-[#3f3f3f] dark:text-white dark:hover:border-[#5f5f5f] dark:hover:bg-[#222222] dark:focus:ring-offset-[#0f0f0f]',
                        isOpen && 'dark:border-(--primary-500) dark:bg-[#222222] border-(--primary-500) bg-gray-50',
                    )}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className="flex-1 truncate text-left">{selectedOption?.label ?? selectedOption?.value}</span>
                    {selectedOption?.badge && (
                        <QualityBadge
                            text={selectedOption.badge}
                            className="ml-2 uppercase !text-white dark:bg-gray-900"
                        />
                    )}

                    <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 dark:text-gray-400 text-gray-600 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div
                        className={cn(
                            'animate-in fade-in absolute z-50 w-full overflow-hidden rounded-lg border border-gray-300 bg-white duration-200 dark:border-[#3f3f3f] dark:bg-[#1a1a1a]',
                            position === 'bottom' ? 'slide-in-from-top-2 mt-2 top-full' : 'slide-in-from-bottom-2 mb-2 bottom-full',
                        )}
                        role="listbox"
                    >
                        {searchable && (
                            <div className="flex h-[56px] items-center border-b p-2 px-4 font-normal">
                                <Search className="text-text-secondary h-4 w-4" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.stopPropagation()}
                                    placeholder="Search"
                                    className="bg-color-white z-30 w-full border-none px-2 py-2 pl-[9px] text-sm font-normal focus:outline-none focus:ring-0"
                                />
                            </div>
                        )}

                        <div className={`max-h-60 overflow-y-auto ${searchable ? '' : 'py-1'}`}>
                            {filteredOptions.map((option) => {
                                const isSelected = option.value === selectedOption?.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base text-left flex items-center justify-between gap-2 transition-colors duration-150 ${
                                            isSelected
                                                ? 'bg-(--primary-50) text-(--primary-600) dark:bg-(--primary-600)/20 dark:text-(--primary-400)'
                                                : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-[#282828]'
                                        }`}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <span className="truncate">{option.label ?? option.value}</span>
                                        {isSelected && (
                                            <Check className="dark:text-(--primary-400) text-(--primary-600) h-4 w-4 flex-shrink-0" />
                                        )}

                                        {option.badge && (
                                            <QualityBadge
                                                text={option.badge}
                                                className="ml-2 uppercase !text-white dark:bg-gray-900"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
