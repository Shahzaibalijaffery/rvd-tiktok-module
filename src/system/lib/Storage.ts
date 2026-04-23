export default class Storage {
    static local = {
        async get<T>(key: string): Promise<T | undefined> {
            return Storage.get('local', key);
        },
        async set(key: string, value: unknown) {
            return Storage.set('local', key, value);
        },
        async remove(key: string) {
            return Storage.remove('local', key);
        },
        async clear() {
            return Storage.clear('local');
        },
    };

    static sync = {
        async get<T>(key: string): Promise<T | undefined> {
            return Storage.get('sync', key);
        },
        async set(key: string, value: unknown) {
            return Storage.set('sync', key, value);
        },
        async remove(key: string) {
            return Storage.remove('sync', key);
        },
        async clear() {
            return Storage.clear('sync');
        },
    };

    private static async get<T>(area: 'local' | 'sync', key: string): Promise<T | undefined> {
        return (await chrome.storage[area].get(key))[key] as T | undefined;
    }

    private static async set(area: 'local' | 'sync', key: string, value: unknown) {
        return chrome.storage[area].set({ [key]: value });
    }

    private static async remove(area: 'local' | 'sync', key: string) {
        return chrome.storage[area].remove(key);
    }

    private static async clear(area: 'local' | 'sync') {
        return chrome.storage[area].clear();
    }
}
