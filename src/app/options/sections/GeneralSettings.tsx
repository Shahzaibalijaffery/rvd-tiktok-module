import type { ChangeEvent } from 'react';

import { Download, Loader2, RotateCcw, Sliders, Upload } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { options as optionsStore } from '@/core/common/globals';
import { readFile, sleep } from '@/system/lib/utils';
import { useOptionsStore } from '../options-store';
import { ConfirmationModal } from './ConfirmationModal';
import { SettingsCard } from './SettingsCard';

export default function GeneralSettings() {
    const [isDarkMode, theme, changeTheme, setToast] = useOptionsStore(useShallow(state => [
        state.isDarkMode,
        state.theme,

        state.changeTheme,
        state.setToast,
    ]));

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

    async function exportSettings() {
        setIsExporting(true);
        await optionsStore.export('royal-downloader-settings');
        await sleep(500);
        setIsExporting(false);

        setToast({ message: 'Settings exported successfully!', type: 'success' });
    }

    async function importSettings(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file)
            return;

        setIsImporting(true);

        // Check file extension
        if (!file.name.endsWith('.json')) {
            setToast({ message: 'Failed to import settings. Invalid file format.', type: 'error' });
            setIsImporting(false);
            return;
        }

        // Try to read and parse the file
        const content = await readFile(file);
        let data: Record<string, unknown>;

        try {
            data = JSON.parse(content) as Record<string, unknown>;
        }
        catch {
            setToast({ message: 'Failed to import settings. Invalid file content.', type: 'error' });
            setIsImporting(false);
            return;
        }

        await optionsStore.import(data);

        setToast({ message: 'Settings imported successfully! Reloading...', type: 'success' });
        await sleep(1000);
        setIsImporting(false);
    }

    async function resetSettings() {
        setIsResetting(true);
        await optionsStore.reset();

        setToast({ message: 'Settings reset to defaults! Reloading...', type: 'success' });
        await sleep(1000);
        setIsResetting(false);
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>General Settings</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manage your data and privacy preferences for the extension.
                </p>
            </div>

            {/* Appearance Section */}
            <SettingsCard
                title="Appearance"
                description="Customize the visual appearance of the extension."
                isDarkMode={isDarkMode}
                icon={<Sliders className={`w-5 h-5 ${isDarkMode ? 'text-(--primary-400)' : 'text-(--primary-600)'}`} />}
            >
                <div className="space-y-3">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                        {([
                            { value: 'light', label: 'Light', icon: '☀️' },
                            { value: 'dark', label: 'Dark', icon: '🌙' },
                            { value: 'system', label: 'System', icon: '💻' },
                        ] as const).map(option => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    changeTheme(option.value);
                                }}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                    theme === option.value
                                        ? isDarkMode
                                            ? 'border-(--primary-500) bg-(--primary-500)/10'
                                            : 'border-(--primary-600) bg-(--primary-50)'
                                        : isDarkMode
                                            ? 'border-[#3f3f3f] bg-[#1a1a1a] hover:border-[#4f4f4f]'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                <div className="mb-2 text-2xl">{option.icon}</div>
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {option.label}
                                </div>
                                {theme === option.value && (
                                    <div className={`mt-2 text-xs font-medium ${isDarkMode ? 'text-(--primary-400)' : 'text-(--primary-600)'}`}>
                                        Active
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </SettingsCard>

            {/* Data & Privacy Section */}
            <SettingsCard
                title="Data & Privacy"
                description="Manage your settings data, create backups, and control your privacy preferences."
                isDarkMode={isDarkMode}
            >
                <div className="space-y-4">
                    <div>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Export Settings
                        </h4>
                        <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Download a backup of all your settings and custom code entries.
                        </p>
                        <button
                            onClick={exportSettings}
                            disabled={isExporting}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                isExporting
                                    ? 'bg-(--primary-500) cursor-not-allowed opacity-75'
                                    : isDarkMode
                                        ? 'bg-(--primary-600) hover:bg-(--primary-700) text-white'
                                        : 'bg-(--primary-600) hover:bg-(--primary-700) text-white'
                            }`}
                        >
                            {isExporting
                                ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Exporting...
                                        </>
                                    )
                                : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Export Settings
                                        </>
                                    )}
                        </button>
                    </div>

                    <div>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Import Settings
                        </h4>
                        <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Restore your settings from a previously exported backup file.
                        </p>
                        <button
                            disabled={isImporting}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer relative ${
                                isImporting
                                    ? 'border-[#3f3f3f] bg-[#2a2a2a] cursor-not-allowed opacity-75'
                                    : isDarkMode
                                        ? 'border-[#3f3f3f] bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white'
                                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
                            }`}
                        >
                            <input
                                type="file"
                                className="absolute left-0 top-0 h-full w-full cursor-pointer opacity-0"
                                accept="application/json"
                                onChange={importSettings}
                                disabled={isImporting}
                            />
                            {isImporting
                                ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    )
                                : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Import Settings
                                        </>
                                    )}
                        </button>
                    </div>

                    <div>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Reset All Settings
                        </h4>
                        <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Reset all settings to their default values. This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowResetConfirmModal(true)}
                            disabled={isResetting}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                isResetting ? 'bg-red-500 cursor-not-allowed opacity-75' : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {isResetting
                                ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Resetting...
                                        </>
                                    )
                                : (
                                        <>
                                            <RotateCcw className="h-4 w-4" />
                                            Reset All Settings
                                        </>
                                    )}
                        </button>
                    </div>
                </div>
            </SettingsCard>

            <ConfirmationModal
                isOpen={showResetConfirmModal}
                onClose={() => setShowResetConfirmModal(false)}
                onConfirm={resetSettings}
                title="Reset All Settings"
                message="Are you sure you want to reset all settings to their default values? This action cannot be undone and all your custom configurations will be lost."
                isDarkMode={isDarkMode}
                isDestructive={true}
            />
        </div>
    );
}
