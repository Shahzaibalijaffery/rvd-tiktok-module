import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/system/lib/utils';

function TooltipProvider({
    delayDuration = 0,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    );
}

function Tooltip({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root data-slot="tooltip" {...props} />
        </TooltipProvider>
    );
}

function TooltipTrigger({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 0,
    children,
    usePortal = true,
    showArrow = true,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
    usePortal?: boolean;
    showArrow?: boolean;
}) {
    return usePortal
        ? (
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        data-slot="tooltip-content"
                        sideOffset={sideOffset}
                        className={cn(
                            'bg-neutral-950 text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance dark:bg-neutral-50 dark:text-neutral-950 font-medium',
                            className,
                        )}
                        {...props}
                    >
                        {children}
                        {showArrow && <TooltipPrimitive.Arrow className="size-2.5 z-50 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-neutral-950 fill-black dark:bg-neutral-50 dark:fill-white" />}
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            )
        : (
                <TooltipPrimitive.Content
                    data-slot="tooltip-content"
                    sideOffset={sideOffset}
                    className={cn(
                        'bg-neutral-950 text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance dark:bg-neutral-50 dark:text-neutral-950 font-medium',
                        className,
                    )}
                    {...props}
                >
                    {children}
                    {showArrow && <TooltipPrimitive.Arrow className="size-2.5 z-50 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-neutral-950 fill-black dark:bg-neutral-50 dark:fill-white" />}
                </TooltipPrimitive.Content>
            );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
