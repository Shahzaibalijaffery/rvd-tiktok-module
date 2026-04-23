import type { Mp3Bitrate } from '@/system/types';

import { useShallow } from 'zustand/react/shallow';

import CustomSelect from '@/app/components/CustomSelect';
import { useOptionsStore } from '../options-store';
import { SettingsCard } from './SettingsCard';

export default function AudioDownloads() {
    const [
        isDarkMode,
        mp3DefaultBitrate,

        changeOption,
    ] = useOptionsStore(useShallow(state => [
        state.isDarkMode,
        state.options.mp3DefaultBitrate,

        state.changeOption,
    ]));

    return (
        <div className="space-y-8">
            <div>
                <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Audio Downloads</h2>
                <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Configure audio formats, ID3 tags, and quality settings for audio downloads.
                </p>
            </div>

            <SettingsCard
                title="Preferred MP3 Bitrate Settings"
                description="Allows you to select the preferred bitrates for MP3 downloads, ensuring audio files are saved at your desired quality level."
                isDarkMode={isDarkMode}
            >
                <div className="max-w-xs">
                    <CustomSelect
                        value={String(mp3DefaultBitrate)}
                        onChange={v => changeOption('mp3DefaultBitrate', Number(v) as unknown as Mp3Bitrate)}
                        options={[
                            { value: '128', label: '128 Kbps' },
                            { value: '192', label: '192 Kbps' },
                            { value: '256', label: '256 Kbps' },
                            { value: '320', label: '320 Kbps' },
                        ]}
                    />
                </div>
            </SettingsCard>
        </div>
    );
}
