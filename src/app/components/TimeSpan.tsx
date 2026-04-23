import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { formatTime, parseTime } from '@/system/lib/utils';
import { Label } from './ui/label';

interface Props {
    value: [number, number];
    setValue: (value: [number, number]) => void;
    length: number;
}

export default function TimeSpan({
    value,
    setValue,
    length,
}: Props) {
    const [selectedField, setSelectedField] = useState<'hours' | 'minutes' | 'seconds'>('seconds');
    const [_activeInput, setActiveInput] = useState<number | null>(null);
    const [_, setError] = useState<string>('');
    const [_isActive, setIsActive] = useState<boolean>(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.composedPath()[0] as HTMLElement;

            if (
                inputRef.current
                && !inputRef.current.contains(event.target as Node)
                && !target.closest('.btns')
            ) {
                setIsActive(false);
                setSelectedField('seconds');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleTimeChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number,
    ) => {
        const inputValue = e.target.value;
        try {
            const newTime = parseTime(inputValue);
            if (newTime > length) {
                setError('Time cannot be greater than 1:40:00');
            }
            else {
                setError('');
                if (index === 0) {
                    setValue([newTime, value[1]]);
                }
                else {
                    setValue([value[0], newTime]);
                }
            }
        }
        catch {
            setError('Invalid time format');
        }
    };

    const adjustTime = (action: 'increment' | 'decrement', index: number) => {
        if (!selectedField)
            return;

        const [start, end] = value;
        const time = index === 0 ? start : end;

        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        const adjust = (v: number) => (action === 'increment' ? v + 1 : v - 1);

        let newHours = hours;
        let newMinutes = minutes;
        let newSeconds = seconds;

        switch (selectedField) {
            case 'hours':
                newHours = adjust(hours);
                break;
            case 'minutes':
                newMinutes = adjust(minutes);
                break;
            case 'seconds':
                newSeconds = adjust(seconds);
                break;
            default: break;
        }

        let newTime = newHours * 3600 + newMinutes * 60 + newSeconds;
        if (newTime > length) {
            newTime = length;
        }
        else if (newTime < 0) {
            newTime = 0;
        }

        if (index === 0) {
            setValue([newTime, value[1]]);
        }
        else {
            setValue([value[0], newTime]);
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
    ) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedField) {
                adjustTime(e.key === 'ArrowUp' ? 'increment' : 'decrement', index);
            }
        }
    };

    const getField = (position: number): 'hours' | 'minutes' | 'seconds' => {
        if (position < 3)
            return 'hours';
        if (position < 6)
            return 'minutes';
        return 'seconds';
    };

    const highlightField = (input: HTMLInputElement) => {
        const position = input.selectionStart!;
        let start;
        let end;
        if (position < 3) {
            start = 0;
            end = 2;
        }
        else if (position < 6) {
            start = 3;
            end = 5;
        }
        else {
            start = 6;
            end = 8;
        }
        input.setSelectionRange(start, end);
    };

    const handleClick = (
        e: React.MouseEvent<HTMLInputElement>,
        index: number,
    ) => {
        const input = e.currentTarget;
        const position = input.selectionStart!;

        setSelectedField(getField(position));
        setActiveInput(index);
        highlightField(input);
        setIsActive(true);
    };

    // const getInputStyle = (index: number) => {
    //     const isActiveInput = activeInput === index;
    //     return `rounded-xl border p-3 text-[16px] w-full transition-colors relative ${
    //         isActiveInput && isActive
    //             ? 'border-black dark:border-white'
    //             : 'border-input dark:border-[#383838]'
    //     }`;
    // };

    return (
        <div
            className="grid w-full grid-cols-2 gap-3"
        >
            {['From', 'To'].map((label, index) => (
                <div className="flex flex-col" key={label}>
                    <Label className="mb-1.5 block text-xs font-semibold">{label}</Label>
                    <div className="flex items-center gap-2">
                        <div className="bg-tab-bg relative flex w-full overflow-hidden rounded-xl border pl-2.5 text-sm transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Start Time"
                                className="w-full cursor-default bg-transparent text-sm outline-none dark:bg-transparent"
                                value={formatTime(value[index]!)}
                                onChange={e => handleTimeChange(e, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onClick={e => handleClick(e, index)}
                                readOnly
                            />
                            <div className="btns flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => adjustTime('increment', index)}
                                    className="hover:bg-hover flex h-5 w-8 cursor-pointer items-center justify-center border border-r-0 border-t-0"
                                >
                                    <ChevronUp className="h-[15px] w-[15px]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustTime('decrement', index)}
                                    className="hover:bg-hover flex h-5 w-8 cursor-pointer items-center justify-center border border-y-0 border-r-0"
                                >
                                    <ChevronDown className="h-[15px] w-[15px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
