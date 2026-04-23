import type { LucideIcon } from 'lucide-react';
import type { DownloadTab } from '@/app/popup/popup-store';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ImageIcon, Music, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Props {
    disabled: boolean;
}

export default function TabsNavigation({ disabled }: Props) {
    const tabs: { [key in DownloadTab]?: { icon: LucideIcon; label: string; inactive?: boolean } } = {
        video: { icon: Video, label: 'Video' },
        audio: { icon: Music, label: 'Audio' },
        thumbnails: { icon: ImageIcon, label: 'Thumbnails' },
    };

    const [emblaRef, emblaApi] = useEmblaCarousel({
        containScroll: 'trimSnaps',
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const onSelect = useCallback(
        (emblaApi: {
            canScrollPrev: () => boolean;
            canScrollNext: () => boolean;
        }) => {
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        },
        [],
    );

    useEffect(() => {
        if (!emblaApi)
            return;

        onSelect(emblaApi);

        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(
        () => emblaApi && emblaApi.scrollPrev(),
        [emblaApi],
    );

    const scrollNext = useCallback(
        () => emblaApi && emblaApi.scrollNext(),
        [emblaApi],
    );

    return (
        <div className="bg-bg border-card-border relative z-40 border-b px-5 py-3">
            {canScrollPrev && (
                <button
                    onClick={scrollPrev}
                    className="bg-card-bg hover:bg-hover border-card-border absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border p-1 shadow"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            )}

            <div className="overflow-hidden" ref={emblaRef}>
                <TabsList className="-mb-1 flex gap-2 pb-1 outline-none focus:outline-none">
                    {Object.entries(tabs).map(([key, { icon: Icon, label, inactive }]) => (
                        !inactive && (
                            <div
                                key={key}
                                className="flex-[0_0_auto] cursor-pointer select-none"
                            >
                                <TabsTrigger
                                    disabled={disabled}
                                    value={key}
                                    className="disabled:opacity-55 disabled:hover:bg-tab-bg focus:ring-primary bg-tab-bg text-tab-text hover:bg-secondary/60 data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:border-primary min-h-[40px] flex-shrink-0 cursor-pointer gap-2 whitespace-nowrap rounded-lg border-2 border-transparent px-4 py-2 ring-0 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{label}</span>
                                </TabsTrigger>
                            </div>
                        )
                    ))}
                </TabsList>
            </div>

            {canScrollNext && (
                <button
                    onClick={scrollNext}
                    className="bg-card-bg hover:bg-hover border-card-border absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border p-1 shadow"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
