import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { cn, formatTime } from '@/system/lib/utils';

function Slider({
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    showTooltip = false,
    tooltipContent,
    ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
    showTooltip?: boolean;
    tooltipContent?: (value: number) => React.ReactNode;
}) {
    const [internalValues, setInternalValues] = React.useState<number[]>(
        Array.isArray(value)
            ? value
            : Array.isArray(defaultValue)
                ? defaultValue
                : [min, max],
    );

    React.useEffect(() => {
        if (value !== undefined) {
            setInternalValues(Array.isArray(value) ? value : [value]);
        }
    }, [value]);

    const handleValueChange = (newValue: number[]) => {
        setInternalValues(newValue);
        props.onValueChange?.(newValue);
    };

    const [showTooltipState, setShowTooltipState] = React.useState(false);

    const handlePointerDown = () => {
        if (showTooltip) {
            setShowTooltipState(true);
        }
    };

    const handlePointerUp = React.useCallback(() => {
        if (showTooltip) {
            setShowTooltipState(false);
        }
    }, [showTooltip]);

    React.useEffect(() => {
        if (showTooltip) {
            document.addEventListener('pointerup', handlePointerUp);
            return () => {
                document.removeEventListener('pointerup', handlePointerUp);
            };
        }
    }, [showTooltip, handlePointerUp]);

    const renderThumb = (value: number) => {
        const thumb = (
            <SliderPrimitive.Thumb
                data-slot="slider-thumb"
                className="size-5 border-primary active:bg-primary ring-primary/30 block shrink-0 cursor-pointer rounded-full border-2 bg-white shadow-sm outline-none transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
                onPointerDown={handlePointerDown}
            />
        );

        if (!showTooltip)
            return thumb;

        return (
            <TooltipProvider>
                <Tooltip open={showTooltipState}>
                    <TooltipTrigger asChild>{thumb}</TooltipTrigger>
                    <TooltipContent
                        className="px-2 py-2 text-xs font-medium"
                        sideOffset={8}
                        side={props.orientation === 'vertical' ? 'right' : 'top'}
                        usePortal={false}
                    >
                        <p>
                            {tooltipContent ? tooltipContent(value) : formatTime(value)}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <SliderPrimitive.Root
            data-slot="slider"
            defaultValue={defaultValue}
            value={value}
            min={min}
            max={max}
            className={cn(
                'relative flex w-full touch-none  items-center select-none mt-2 data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
                className,
            )}
            onValueChange={handleValueChange}
            {...props}
        >
            <SliderPrimitive.Track
                data-slot="slider-track"
                className={cn(
                    'relative grow overflow-hidden rounded-full bg-neutral-100 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5 dark:bg-neutral-800',
                )}
            >
                <SliderPrimitive.Range
                    data-slot="slider-range"
                    className={cn(
                        'absolute  data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full bg-primary',
                    )}
                />
            </SliderPrimitive.Track>
            {Array.from({ length: internalValues.length }, (_, index) => (
                <React.Fragment key={index}>
                    {renderThumb(internalValues[index]!)}
                </React.Fragment>
            ))}
        </SliderPrimitive.Root>
    );
}

export { Slider };
