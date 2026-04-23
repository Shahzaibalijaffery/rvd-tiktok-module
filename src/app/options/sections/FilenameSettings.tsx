import type { FilenamePattern } from '@/system/types';
import { objectEntries } from 'ts-extras';

import { useShallow } from 'zustand/react/shallow';
import { useOptionsStore } from '../options-store';
import { CustomInput } from './CustomInput';
import { SettingsCard } from './SettingsCard';
import { ToggleSwitch } from './ToggleSwitch';

export default function FilenameSettings() {
    const [
        isDarkMode,
        filenamePattern,
        filenameOnConflict,
        removeSpecialCharacters,
        replaceSpecialCharactersWith,
        limitFilenameCharacters,
        filenameCharacterLimit,
        filenameCaseManagementEnabled,
        filenameCaseManagement,
        changeOption,
    ] = useOptionsStore(useShallow(state => [
        state.isDarkMode,
        state.options.filenamePattern,
        state.options.filenameOnConflict,
        state.options.removeSpecialCharacters,
        state.options.replaceSpecialCharactersWith,
        state.options.limitFilenameCharacters,
        state.options.filenameCharacterLimit,
        state.options.filenameCaseManagementEnabled,
        state.options.filenameCaseManagement,

        state.changeOption,
    ]));

    const availableFilenameTokens: Record<FilenamePattern, string> = {
        'filename': 'Filename',
        'source-website': 'Source Website',
        'quality': 'Quality',
        'date': 'Date',
        'time': 'Time',
    };

    const availableConflictResolutionOptions: Record<'uniquify' | 'overwrite' | 'prompt', string> = {
        uniquify: 'Auto-Rename',
        overwrite: 'Overwrite Existing',
        prompt: 'Ask Every Time',
    };

    const availableCaseManagementOptions: Record<'original' | 'lowercase' | 'uppercase', string> = {
        original: 'Original Case',
        lowercase: 'Lowercase',
        uppercase: 'Uppercase',
    };

    function addToken(token: FilenamePattern) {
        if (!filenamePattern.includes(token)) {
            changeOption('filenamePattern', [...filenamePattern, token]);
        }
    }

    function removeToken(token: FilenamePattern) {
        changeOption('filenamePattern', filenamePattern.filter(t => t !== token));
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* File Naming Pattern */}
            <SettingsCard
                title="File Naming Settings"
                description="Customize how downloaded files are named by selecting and arranging naming components."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-4">
                    {/* Available Tokens */}
                    <div>
                        <label
                            className={`block text-xs sm:text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            Available Components
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {objectEntries(availableFilenameTokens).map(([key, label]) => {
                                const isAdded = filenamePattern.includes(key);

                                return (
                                    <button
                                        key={key}
                                        onClick={() => addToken(key)}
                                        disabled={isAdded}
                                        className={`px-3 sm:px-4 py-2 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-all cursor-pointer ${
                                            isAdded
                                                ? isDarkMode
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : isDarkMode
                                                    ? 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Pattern */}
                    <div>
                        <label
                            className={`block text-xs sm:text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            File Name Pattern
                        </label>
                        <div
                            className={`min-h-[60px] p-3 sm:p-4 rounded-lg border-2 ${
                                isDarkMode ? 'bg-[#1f1f1f] border-[#3f3f3f]' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            {filenamePattern.length > 0
                                ? (
                                        <div className="flex flex-wrap gap-2">
                                            {filenamePattern.map((key) => {
                                                const label = availableFilenameTokens[key];

                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg ${
                                                            isDarkMode ? 'bg-(--primary-500)/20 text-(--primary-400)' : 'bg-(--primary-50) text-(--primary-600)'
                                                        }`}
                                                    >
                                                        <span className="font-medium">{label}</span>
                                                        <button
                                                            onClick={() => removeToken(key)}
                                                            className={`hover:opacity-70 transition-opacity cursor-pointer ${
                                                                isDarkMode ? 'text-(--primary-400)' : 'text-(--primary-600)'
                                                            }`}
                                                        >
                                                            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M6 18L18 6M6 6l12 12"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                : (
                                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Click components above to build your file naming pattern
                                        </p>
                                    )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <label
                            className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            Preview
                        </label>
                        <div
                            className={`p-3 rounded-lg font-mono text-xs sm:text-sm break-all ${
                                isDarkMode ? 'bg-[#1f1f1f] text-gray-400' : 'bg-gray-50 text-gray-600'
                            }`}
                        >
                            {filenamePattern.length > 0
                                ? `${filenamePattern
                                    .map((id) => {
                                        const examples: Record<FilenamePattern, string> = {
                                            'filename': 'video_title',
                                            'source-website': 'youtube',
                                            'quality': '1080p',
                                            'date': '2024-01-15',
                                            'time': '14-30-45',
                                        };
                                        return examples[id] || id;
                                    })
                                    .join('_')}.mp4`
                                : 'example_filename.mp4'}
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* File Name Conflicts */}
            <SettingsCard
                title="File Name Conflicts"
                description="Resolves conflicts when files with the same name are downloaded or saved, ensuring that existing files are not overwritten."
                isDarkMode={isDarkMode}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {objectEntries(availableConflictResolutionOptions).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => changeOption('filenameOnConflict', key)}
                            className={`flex items-center gap-3 px-4 sm:px-5 py-3 text-sm sm:text-base rounded-lg border-2 transition-all cursor-pointer ${
                                filenameOnConflict === key
                                    ? isDarkMode
                                        ? 'bg-(--primary-500)/10 border-(--primary-500) text-(--primary-400)'
                                        : 'bg-(--primary-50) border-(--primary-500) text-(--primary-600)'
                                    : isDarkMode
                                        ? 'bg-[#2a2a2a] border-[#3f3f3f] text-gray-300 hover:border-[#5f5f5f]'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    filenameOnConflict === key
                                        ? isDarkMode
                                            ? 'border-(--primary-500)'
                                            : 'border-(--primary-500)'
                                        : isDarkMode
                                            ? 'border-gray-500'
                                            : 'border-gray-300'
                                }`}
                            >
                                {filenameOnConflict === key && (
                                    <div className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-(--primary-500)' : 'bg-(--primary-500)'}`} />
                                )}
                            </div>
                            <span className="font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </SettingsCard>

            {/* Remove Special Characters */}
            <SettingsCard
                title="Remove Special Characters"
                description="Automatically removes unsupported special characters from file names, such as \ / : * ? &quot; < > & |, to ensure compatibility and prevent errors during saving or downloading."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Enable Special Character Removal
                        </span>
                        <ToggleSwitch
                            checked={removeSpecialCharacters}
                            onChange={v => changeOption('removeSpecialCharacters', v)}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {removeSpecialCharacters && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Replace with (e.g., '-')
                            </label>
                            <CustomInput
                                value={replaceSpecialCharactersWith}
                                onChange={value => changeOption('replaceSpecialCharactersWith', value)}
                                placeholder="Enter replacement character"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}
                </div>
            </SettingsCard>

            {/* File Name Character Limit */}
            <SettingsCard
                title="File Name Character Limit"
                description="Sets a maximum character limit for file names to ensure compatibility across different systems and prevent errors during saving or downloading."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Enable Character Limit
                        </span>
                        <ToggleSwitch
                            checked={limitFilenameCharacters}
                            onChange={v => changeOption('limitFilenameCharacters', v)}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {limitFilenameCharacters && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Maximum Characters
                            </label>
                            <CustomInput
                                type="number"
                                value={filenameCharacterLimit.toString()}
                                onChange={v => changeOption('filenameCharacterLimit', Number.parseInt(v))}
                                placeholder="255"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}
                </div>
            </SettingsCard>

            {/* File Name Case Management */}
            <SettingsCard
                title="File Name Case Management"
                description="Defines whether file names should be automatically converted to uppercase, lowercase, or retain their original case during saving or downloading."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Enable Case Management
                        </span>
                        <ToggleSwitch
                            checked={filenameCaseManagementEnabled}
                            onChange={v => changeOption('filenameCaseManagementEnabled', v)}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {filenameCaseManagementEnabled && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            {objectEntries(availableCaseManagementOptions).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => changeOption('filenameCaseManagement', key)}
                                    className={`flex items-center gap-3 px-4 sm:px-5 py-3 text-sm sm:text-base rounded-lg border-2 transition-all cursor-pointer ${
                                        filenameCaseManagement === key
                                            ? isDarkMode
                                                ? 'bg-(--primary-500)/10 border-(--primary-500) text-(--primary-400)'
                                                : 'bg-(--primary-50) border-(--primary-500) text-(--primary-600)'
                                            : isDarkMode
                                                ? 'bg-[#2a2a2a] border-[#3f3f3f] text-gray-300 hover:border-[#5f5f5f]'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                            filenameCaseManagement === key
                                                ? isDarkMode
                                                    ? 'border-(--primary-500)'
                                                    : 'border-(--primary-500)'
                                                : isDarkMode
                                                    ? 'border-gray-500'
                                                    : 'border-gray-300'
                                        }`}
                                    >
                                        {filenameCaseManagement === key && (
                                            <div className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-(--primary-500)' : 'bg-(--primary-500)'}`} />
                                        )}
                                    </div>
                                    <span className="font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
}
