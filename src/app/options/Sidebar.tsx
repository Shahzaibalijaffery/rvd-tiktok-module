import { Download, FileText, Music, Sliders } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useOptionsStore } from './options-store';

const SECTIONS = [
    {
        id: 'general',
        icon: Sliders,
        label: 'General Settings',
        description: 'Appearance, theme, data management & privacy preferences',
    },
    {
        id: 'audio-downloads',
        icon: Music,
        label: 'Audio Downloads',
        description: 'Configure audio formats, ID3 tags, and quality settings',
    },
    {
        id: 'download-settings',
        icon: Download,
        label: 'Download Settings',
        description: 'Configure download directory and parallel download settings',
    },
    {
        id: 'file-naming',
        icon: FileText,
        label: 'File Naming Settings',
        description: 'Customize file naming patterns, conflicts, and character handling',
    },
] as const;

export default function Sidebar() {
    const [isDarkMode, activeSection, setActiveSection] = useOptionsStore(useShallow(state => [
        state.isDarkMode,
        state.activeSection,

        state.setActiveSection,
    ]));

    const { version } = chrome.runtime.getManifest();

    return (
        <div
            className={`w-1/6 h-full border-r min-h-screen flex-shrink-0 flex flex-col ${isDarkMode ? 'border-[#3f3f3f] bg-[#181818]' : 'border-gray-200 bg-white'}`}
        >
            <div className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-5">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all cursor-pointer ${
                                isActive
                                    ? isDarkMode
                                        ? 'bg-(--primary-600)/10 border-2 border-(--primary-600)/50'
                                        : 'bg-(--primary-50) border-2 border-(--primary-200)'
                                    : isDarkMode
                                        ? 'hover:bg-[#282828] border-2 border-transparent'
                                        : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                            aria-label={`Navigate to ${section.label}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                        isActive
                                            ? isDarkMode
                                                ? 'bg-(--primary-600)/20'
                                                : 'bg-(--primary-100)'
                                            : isDarkMode
                                                ? 'bg-[#282828]'
                                                : 'bg-gray-100'
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                            isActive
                                                ? isDarkMode
                                                    ? 'text(--primary-400)'
                                                    : 'text-(--primary-600)'
                                                : isDarkMode
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                        }`}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3
                                        className={`text-sm font-semibold mb-1 sm:mb-1.5 ${
                                            isActive
                                                ? isDarkMode
                                                    ? 'text-(--primary-400)'
                                                    : 'text-(--primary-700)'
                                                : isDarkMode
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                        }`}
                                    >
                                        {section.label}
                                    </h3>
                                    <p
                                        className={`text-xs leading-relaxed ${
                                            isActive
                                                ? isDarkMode
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                                : isDarkMode
                                                    ? 'text-gray-500'
                                                    : 'text-gray-600'
                                        }`}
                                    >
                                        {section.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <div
                                        className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${isDarkMode ? 'bg-(--primary-400)' : 'bg-(--primary-600)'}`}
                                    />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div
                className={`w-full p-4 sm:p-5 border-t ${isDarkMode ? 'border-[#3f3f3f] bg-[#181818]' : 'border-gray-200 bg-white'}`}
            >
                <p
                    className={`text-xs text-center font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    Royal Video Downloader
                    {`v${version}`}
                </p>
                <p
                    className={`text-xs text-center ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                >
                    Media Detection Extension
                </p>
            </div>
        </div>
    );
}
