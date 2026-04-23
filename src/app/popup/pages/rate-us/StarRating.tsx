import { Star } from 'lucide-react';
import { useState } from 'react';

import ActionButton from '@/app/components/ActionButton';
import { usePopupStore } from '@/app/popup/popup-store';
import { runtimeMessageInstance } from '@/core/common/globals';
import { __t } from '@/system/lib/i18n';
import Storage from '@/system/lib/Storage';
import { cn } from '@/system/lib/utils';

function StarRating({ setRated }: { setRated: (hasRated: boolean) => void }) {
    const goBack = usePopupStore(state => state.goBack);

    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);

    const handleSubmit = async () => {
        if (selectedRating > 3) {
            runtimeMessageInstance('popup').send('background', 'general: open review page');
        }

        setRated(true);
        await Storage.sync.set('hasRated', true);
    };

    return (
        <>
            <div className="mb-8 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= (hoveredRating || selectedRating);
                    return (
                        <button
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="cursor-pointer rounded-full transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                className={cn(
                                    'w-10 h-10 transition-colors text-text-secondary',
                                    isActive
                                    && 'text-black fill-black dark:text-yellow-500 dark:fill-yellow-500',
                                )}
                            />
                        </button>
                    );
                })}
            </div>

            <ActionButton
                text="Submit"
                onClick={handleSubmit}
                disabled={selectedRating === 0}
                className={cn(
                    'py-3.5 px-6 w-full rounded-full border-card-border border bg-primary text-base font-semibold text-white max-w-[320px] mx-auto justify-center',
                    selectedRating === 0
                    && 'text-text-secondary bg-hover cursor-not-allowed',
                )}
            />

            <button
                onClick={goBack}
                className="text-text-secondary hover:text-text-primary mx-auto mt-6 max-w-[320px] cursor-pointer text-sm transition-colors focus:outline-none"
            >
                {__t('popup_rate_no_thanks', 'No, thanks')}
            </button>
        </>
    );
}

export default StarRating;
