import { Star } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { usePopupStore } from '@/app/popup/popup-store';
import { __t } from '@/system/lib/i18n';
import StarRating from './StarRating';
import ThankyouMessage from './ThankyouMessage';

export default function RateUsPage() {
    const [hasRated, setHasRated] = usePopupStore(useShallow(state => [
        state.hasRated,
        state.setHasRated,
    ]));

    return hasRated
        ? <ThankyouMessage />
        : (
                <div className="flex min-h-[400px] items-center justify-center p-5">
                    <div className="max-w-md text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="bg-linear-to-br flex h-20 w-20 items-center justify-center rounded-full from-[#fdc700] to-[#d08700]">
                                <Star className="h-10 w-10 fill-white text-white" />
                            </div>
                        </div>

                        <h2 className="mb-4 text-2xl font-bold">
                            {__t('popup_rate_how_we_did', 'How did we do?')}
                        </h2>

                        <p className="text-text-secondary mb-8 text-sm leading-relaxed">
                            {__t('popup_rate_let_us_know', 'Please let us know how we did with your support request. All feedback is appreciated to help us improve our offering!')}
                        </p>

                        <StarRating setRated={setHasRated} />
                    </div>
                </div>
            );
}
