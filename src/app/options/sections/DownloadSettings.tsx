import { useShallow } from 'zustand/react/shallow';

import { useOptionsStore } from '../options-store';
import { CustomInput } from './CustomInput';
import { SettingsCard } from './SettingsCard';
import { ToggleSwitch } from './ToggleSwitch';

export default function DownloadSettings() {
    const [
        isDarkMode,
        saveAsDialogEnabled,
        downloadDirectory,
        changeOption,
    ] = useOptionsStore(useShallow(state => [
        state.isDarkMode,
        state.options.saveAsDialogEnabled,
        state.options.downloadDirectory,

        state.changeOption,
    ]));

    return (
        <div className="space-y-8">
            <div>
                <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Download Settings</h2>
                <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Configure download directory and parallel download settings.
                </p>
            </div>

            {/* Always Ask for Download Location card */}
            <SettingsCard
                title="Always Ask for Download Location"
                description="Prompts you to select a download location every time, giving you control over where each file is saved."
                isDarkMode={isDarkMode}
            >
                <ToggleSwitch
                    checked={saveAsDialogEnabled}
                    onChange={() => changeOption('saveAsDialogEnabled', !saveAsDialogEnabled)}
                    isDarkMode={isDarkMode}
                />
            </SettingsCard>

            <SettingsCard
                title="Download Behavior"
                description="Control how downloads are handled and organized."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-7">
                    <div>
                        <label className={`text-sm font-semibold mb-2.5 block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Download Directory
                        </label>
                        <CustomInput
                            type="text"
                            value={downloadDirectory}
                            onChange={v => changeOption('downloadDirectory', v)}
                            isDarkMode={isDarkMode}
                        />
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Default location for downloaded files relative to your system's default downloads folder.
                        </p>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
}
