import type { Mp3Bitrate, SingleInfo } from '@/system/types';

import { Download, Info } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import ActionButton from '@/app/components/ActionButton';
import CustomSelect from '@/app/components/CustomSelect';
import MessageScreen from '@/app/components/MessageScreen';
import TimeSpan from '@/app/components/TimeSpan';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { useVideoStore } from '@/app/popup/video-store';

function Mp3ConverterSingle({
    info,
    convertToMp3,
}: {
    info: SingleInfo;
    convertToMp3: (
        bitrate: Mp3Bitrate,
        startTime: number | null,
        endTime: number | null,
    ) => Promise<void>;
}) {
    const [bitrate, setBitrate] = useState<Mp3Bitrate>('128');
    const [time, setTime] = useState<[number, number]>([0, info.length]);
    const [downloading, setDownloading] = useState(false);

    return (
        <>
            <CustomSelect
                heading="Choose MP3 Bitrate"
                options={[
                    { value: '128', label: '128kbps' },
                    { value: '192', label: '192kbps' },
                    { value: '256', label: '256kbps' },
                    { value: '320', label: '320kbps' },
                ]}
                value={bitrate}
                onChange={v => setBitrate(v as Mp3Bitrate)}
            />

            <div className="my-4">
                <Label className="mb-3 block text-sm font-semibold">
                    Time Range
                </Label>

                <div className="flex items-center gap-4">
                    <Slider
                        className="grow"
                        value={time}
                        onValueChange={val =>
                            setTime(val as [number, number])}
                        min={0}
                        max={info.length}
                        step={1}
                        showTooltip
                    />
                </div>
            </div>

            <div className="my-4 py-4">
                <TimeSpan
                    value={time}
                    setValue={setTime}
                    length={info.length}
                />
            </div>

            <ActionButton
                text="Download"
                Icon={Download}
                loading={downloading}
                onClick={async () => {
                    setDownloading(true);

                    const startTime = time[0] > 0 ? time[0] : null;
                    const endTime = time[1] < info.length ? time[1] : null;
                    await convertToMp3(bitrate, startTime, endTime);

                    setDownloading(false);
                }}
            />
        </>
    );
}

export default function YouTubeMp3Converter() {
    const [info, convertToMp3] = useVideoStore(
        useShallow(state => [state.info, state.convertToMp3]),
    );

    if (!info)
        return null;

    if (info.type === 'list') {
        return (
            <MessageScreen
                icon={Info}
                message="MP3 conversion is available when a single video is open, not on the feed or Reels tab list."
            />
        );
    }

    return <Mp3ConverterSingle info={info} convertToMp3={convertToMp3} />;
}
