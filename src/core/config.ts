import type { ExtensionOptions, UserData } from './types';

export const DEFAULT_OPTIONS: ExtensionOptions = {
    theme: 'light',
    mp3DefaultBitrate: '192',

    saveAsDialogEnabled: false,
    downloadDirectory: 'RoyalVideoDownloader',

    filenamePattern: ['filename'],
    filenameOnConflict: 'prompt',
    removeSpecialCharacters: false,
    replaceSpecialCharactersWith: '_',
    limitFilenameCharacters: false,
    filenameCharacterLimit: 255,
    filenameCaseManagementEnabled: false,
    filenameCaseManagement: 'original',
};

export const DEFAULT_USER_DATA: UserData = {
    installedAt: null,
    downloadsCount: 0,
};
