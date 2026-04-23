class Store<T extends object> {
    private data: T;

    private properties: (keyof T)[];

    private propertiesToStorageKeysMap: { [P in keyof T]: string };

    private storageKeysToPropertiesMap: { [key: string]: keyof T };

    private singlePropertyChangeListeners: {
        [P in keyof T]?: ((oldValue: T[P], newValue: T[P]) => void)[]
    } = {};

    private compositePropertiesChangeListeners: {
        properties: (keyof T)[];
        listener: (changes: { [P in keyof T]?: { oldValue: T[P]; newValue: T[P] } }) => void;
    }[] = [];

    public Ready: Promise<void>;

    constructor(namespace: string, private defaultValues: T) {
        // Set default data as properties
        this.data = { ...defaultValues };

        // Create maps for local properties and storage data
        this.properties = Object.keys(this.data) as (keyof T)[];

        this.propertiesToStorageKeysMap = this.properties.reduce((prev, prop) => {
            prev[prop] = `${namespace}:${prop as string}`;
            return prev;
        }, {} as { [P in keyof T]: string });

        this.storageKeysToPropertiesMap = this.properties.reduce((prev, prop) => {
            prev[`${namespace}:${prop as string}`] = prop;
            return prev;
        }, {} as { [key: string]: keyof T });

        // Add keys as readonly properties to the class
        this.properties.forEach((prop) => {
            Object.defineProperty(this, prop, {
                get: () => {
                    return this.data[prop];
                },
            });
        });

        // Get data from browser storage
        this.Ready = new Promise((resolve) => {
            const storageKeys = Object.keys(this.storageKeysToPropertiesMap);

            void chrome.storage.sync.get(storageKeys).then((storageData) => {
                Object.keys(storageData).forEach((key) => {
                    const dataKey = this.storageKeysToPropertiesMap[key]!;
                    this.data[dataKey] = storageData[key] as T[typeof dataKey];
                });

                resolve();
            });
        });

        // Listen for storage changes in case another script changes the values
        chrome.storage.sync.onChanged.addListener((changes) => {
            const changedItems: { [P in keyof T]?: { oldValue: T[P]; newValue: T[P] } } = {};
            const changedProperties: (keyof T)[] = [];

            Object.keys(changes).forEach((key) => {
                const prop = this.storageKeysToPropertiesMap[key];

                if (typeof prop === 'undefined') {
                    return;
                }

                const oldValue = (typeof changes[key]?.oldValue !== 'undefined'
                    ? changes[key].oldValue
                    : defaultValues[prop]) as T[typeof prop];

                const newValue = (typeof changes[key]?.newValue !== 'undefined'
                    ? changes[key].newValue
                    : defaultValues[prop]) as T[typeof prop];

                // Update local value
                this.data[prop] = newValue;

                // Fill changed data
                changedItems[prop] = { newValue, oldValue };
                changedProperties.push(prop);

                if (this.singlePropertyChangeListeners[prop]) {
                    this.singlePropertyChangeListeners[prop]?.forEach((listener) => {
                        listener(newValue, oldValue);
                    });
                }
            });

            if (changedProperties.length === 0) // No relevant changes or different namespace
                return;

            // Call the banners
            this.compositePropertiesChangeListeners.forEach(({ properties, listener }) => {
                // filters keys
                const data = properties.reduce((prev, prop) => {
                    if (typeof changedItems[prop] !== 'undefined') {
                        prev[prop] = changedItems[prop];
                    }

                    return prev;
                }, {} as { [P in keyof T]?: { oldValue: T[P]; newValue: T[P] } });

                listener(data);
            });
        });
    }

    getAll() {
        return { ...this.data };
    }

    public set<P extends keyof T>(prop: P, value: T[P]): Promise<void>;
    public set(items: Partial<T>): Promise<void>;
    public async set<P extends keyof T>(
        prop: P | Partial<T>,
        value?: T[P],
    ): Promise<void> {
        const store: { [s: string]: unknown } = {};

        // Update a single value
        if (typeof prop === 'string' && typeof value !== 'undefined') {
            // Update current instance
            this.data[prop as P] = value;

            // Update storage
            store[this.propertiesToStorageKeysMap[prop]] = value;
        }
        else {
            // Update multiple items
            const items = prop as Partial<T>;

            Object.keys(items).forEach((p) => {
                const v = items[p as P];
                this.data[p as P] = v!;

                store[this.propertiesToStorageKeysMap[p as P]] = v;
            });
        }

        return chrome.storage.sync.set(store);
    }

    public async reset() {
        await this.set(this.defaultValues);
    }

    public onChange<P extends keyof T>(
        property: P,
        callback: (newValue: T[P], oldValue: T[P]) => void,
    ): void;
    public onChange<P extends keyof T>(
        properties: P[],
        callback: (changes: { [key in P]?: { newValue: T[key]; oldValue: T[key] }; }) => void,
    ): void;
    public onChange(
        properties: null,
        callback: (changes: { [key in keyof T]?: { newValue: T[key]; oldValue: T[key] }; }) => void,
    ): void;

    public onChange<P extends keyof T>(
        properties: P | P[] | null,
        listener: (newValue: T[P], oldValue: T[P]) => void
            | ((changes: { [key in P]?: { newValue: T[key]; oldValue: T[key] } }) => void)
            | ((changes: { [key in keyof T]?: { newValue: T[key]; oldValue: T[key] } }) => void),
    ): void {
        if (properties === null) {
            this.compositePropertiesChangeListeners.push({
                properties: this.properties,
                listener: listener as any,
            });
        }
        else if (Array.isArray(properties)) {
            this.compositePropertiesChangeListeners.push({ properties, listener: listener as any });
        }
        else {
            if (typeof this.singlePropertyChangeListeners[properties] === 'undefined') {
                this.singlePropertyChangeListeners[properties] = [];
            }

            this.singlePropertyChangeListeners[properties]?.push(listener);
        }
    }

    async export(filename: string) {
        const data = await chrome.storage.sync.get(Object.keys(this.storageKeysToPropertiesMap));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        await chrome.downloads.download({ url, filename: `${filename}.json` });
    }

    async import(data: Record<string, unknown>) {
        // Remove all existing data from storage
        await chrome.storage.sync.remove(Object.keys(this.storageKeysToPropertiesMap));

        const store: Partial<T> = {};

        Object.keys(data).forEach((key) => {
            const prop = this.storageKeysToPropertiesMap[key];

            if (typeof prop !== 'undefined') {
                store[prop] = data[key] as T[typeof prop];
            }
        });

        await this.set(store);
    }
}

type ExtendedProperties<T> = { [P in keyof T]: T[P] };

export default <T extends object>(namespace: string, defaultValues: T):
Store<T> & Readonly<ExtendedProperties<T>> => new Store(
    namespace,
    defaultValues,
) as Store<T> & ExtendedProperties<T>;

export type StoreInstance<T extends object> = Store<T> & Readonly<ExtendedProperties<T>>;
