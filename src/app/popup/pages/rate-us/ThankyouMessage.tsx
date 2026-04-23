import { Star } from 'lucide-react';

import ActionButton from '@/app/components/ActionButton';
import { usePopupStore } from '@/app/popup/popup-store';
import { __t } from '@/system/lib/i18n';

function ThankyouMessage() {
    const goBack = usePopupStore(state => state.goBack);

    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="bg-linear-to-br flex h-20 w-20 items-center justify-center rounded-full from-[#05df72] to-[#00a63e]">
                        <Star className="h-10 w-10 fill-white text-white" />
                    </div>
                </div>

                <h2 className="mb-4 text-2xl font-bold">
                    {__t('popup_rate_thankyou_title', 'Thank You!')}
                </h2>

                <p className="text-text-secondary mb-8 text-sm leading-relaxed">
                    {__t('popup_rate_thankyou_message', 'We appreciate your feedback. It helps us improve Royal Video Downloader for everyone!')}
                </p>

                <ActionButton
                    onClick={goBack}
                    text={__t('popup_rate_thankyou_close', 'Close')}
                    className="bg-secondary mx-auto w-full max-w-[320px] justify-center rounded-full border-0 px-6 py-3.5 text-base font-semibold text-black dark:text-white"
                />
            </div>
        </div>
    );
}

export default ThankyouMessage;
