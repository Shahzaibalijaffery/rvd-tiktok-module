import type { PluginOption, UserConfig } from 'vite';

import { resolve } from 'node:path';
import process from 'node:process';
import react from '@vitejs/plugin-react';
import { objectEntries } from 'ts-extras';
import { build } from 'vite';

const entries = {
    'background': 'background.ts',
    'content': 'content.ts',
    'content-main-world': 'content-main-world.ts',
    'popup': 'popup/popup.tsx',
    'options': 'options/options.tsx',
} as const;

const mode = process.argv.includes('--development') ? 'development' : 'production';
const watchEnabled = process.argv.includes('--watch');
const analyzeEnabled = process.argv.includes('--analyze');

function createConfig(
    name: string,
    input: string,
    watch: { include: string[]; exclude: string[] },
    plugins?: PluginOption[],
): UserConfig {
    return {
        mode,
        define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
        plugins,
        build: {
            emptyOutDir: false,
            outDir: 'extension/build',
            minify: mode === 'production' ? 'oxc' : false,
            cssMinify: mode === 'production' ? 'esbuild' : false,
            sourcemap: mode === 'development' || analyzeEnabled,
            rolldownOptions: {
                input,
                output: {
                    entryFileNames: `${name}.js`,
                    assetFileNames: 'assets/[name].[ext]',
                    codeSplitting: false,
                    format: 'iife',
                },
                external: ['node:path'],
            },
            watch: watchEnabled
                ? {
                        include: ['src/**/*', ...watch.include],
                        exclude: ['node_modules/**', ...watch.exclude],
                        clearScreen: false,
                    }
                : null,
        },
    };
}

async function run() {
    for (const [name, entry] of objectEntries(entries)) {
        const input = resolve(`src/app/${entry}`);
        const include = [
            `src/app/${entry}`,
            `src/core/${name}/**`,
        ];

        const exclude = objectEntries(entries)
            .filter(([n]) => n !== name)
            .flatMap(([n, e]) => [`src/app/${e}`, `src/core/${n}/**`]);

        const plugins: PluginOption[] = [];

        if (name === 'popup' || name === 'options' || name === 'content') {
            plugins.push(react());
        }

        await build({
            configFile: false,
            ...createConfig(
                name,
                input,
                { include, exclude },
                plugins,
            ),
        });
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
