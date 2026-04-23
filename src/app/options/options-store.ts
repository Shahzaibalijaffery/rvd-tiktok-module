import type { ExtensionOptions } from '@/core/types';

import { produce } from 'immer';
import { create } from 'zustand';

import { options as optionsStore, userData } from '@/core/common/globals';

type Section = 'general' | 'audio-downloads' | 'download-settings' | 'file-naming';

interface OptionsState {
    ready: boolean;
    init: () => Promise<void>;

    theme: ExtensionOptions['theme'];
    isDarkMode: boolean;
    setTheme: (theme: ExtensionOptions['theme']) => void;
    changeTheme: (newTheme: ExtensionOptions['theme']) => Promise<void>;

    toast: { message: string; type: 'success' | 'error' } | null;
    setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;

    activeSection: Section;
    setActiveSection: (section: Section) => void;

    options: Omit<ExtensionOptions, 'theme'>;
    changeOption: <K extends keyof Omit<ExtensionOptions, 'theme'>>(key: K, value: ExtensionOptions[K]) => Promise<void>;
}

export const useOptionsStore = create<OptionsState>((set, get) => ({
    ready: false,

    async init() {
        const { setTheme } = get();

        await Promise.all([
            optionsStore.Ready,
            userData.Ready,
        ]);

        setTheme(optionsStore.theme);
        set({ options: optionsStore.getAll() });

        optionsStore.onChange(null, (changes) => {
            if (changes.theme) {
                setTheme(changes.theme.newValue);
            }

            set(state => ({
                options: {
                    ...state.options,
                    ...Object.fromEntries(
                        Object.entries(changes).map(([key, change]) => [key, change.newValue]),
                    ),
                },
            }));
        });

        // On Device theme change, check if theme is system and update accordingly
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const { theme } = get();

            if (theme === 'system') {
                setTheme('system');
            }
        });

        optionsStore.onChange('theme', newTheme => setTheme(newTheme));

        // Get initial active section from URL hash for deep linking
        const hash = window.location.hash.replace('#', '');
        if ([
            'general',
            'video-downloads',
            'audio-downloads',
            'download-settings',
            'file-naming',
            'custom-code',
        ].includes(hash)) {
            set({ activeSection: hash as Section });
        }

        set({ ready: true });
    },

    theme: 'light',
    isDarkMode: false,
    setTheme(theme) {
        const systemInDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const activeTheme: 'light' | 'dark' = theme === 'system' ? (systemInDarkMode ? 'dark' : 'light') : theme;

        set({ theme, isDarkMode: activeTheme === 'dark' });

        if (activeTheme === 'light') {
            document.documentElement.classList.remove('dark');
        }
        else {
            document.documentElement.classList.add('dark');
        }
    },
    async changeTheme(newTheme) {
        const { setTheme } = get();

        await optionsStore.set('theme', newTheme);
        setTheme(newTheme);
    },

    toast: null,
    setToast(toast) {
        set({ toast });
    },

    activeSection: 'general',
    setActiveSection(section) {
        // Add section to URL hash for deep linking
        history.replaceState(null, '', `#${section}`);

        set({ activeSection: section });
    },

    options: optionsStore.getAll(),
    async changeOption(key, value) {
        const { options } = get();
        await optionsStore.set(key, value);

        set({
            options: produce(options, (draft) => {
                draft![key] = value;
            }),
        });
    },
}));
