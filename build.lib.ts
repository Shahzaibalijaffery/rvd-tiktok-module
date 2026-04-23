import type { UserConfig } from 'vite';

import { resolve } from 'node:path';
import process from 'node:process';
import react from '@vitejs/plugin-react';
import { objectEntries } from 'ts-extras';
import { build } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import dts from 'vite-plugin-dts';

const entries = {
    'background': 'background/background.ts',
    'content': 'content/content.tsx',
    'content-main-world': 'content-main-world/content-main-world.ts',
    'popup': 'popup/popup.ts',
} as const;

const mode = process.argv.includes('--development') ? 'development' : 'production';
const watchEnabled = process.argv.includes('--watch');
const analyzeEnabled = process.argv.includes('--analyze');

function createConfig(
    name: string,
    entry: string,
): UserConfig {
    return {
        mode,
        define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
        build: {
            emptyOutDir: false,
            outDir: 'dist',
            minify: mode === 'production' ? 'oxc' : false,
            cssMinify: mode === 'production' ? 'esbuild' : false,
            sourcemap: mode === 'development' || analyzeEnabled,
            lib: {
                entry,
                fileName: name,
                formats: ['es'],
            },
            rollupOptions: {
                external: [
                    'node:path',
                    'react',
                    'react-dom/client',
                    'zustand',
                    'zustand/react/shallow',
                    'immer',
                    'lucide-react',

                    'axios',
                    'uuid',
                    'filenamify',
                    '@addoncrop/m3u8-downloader',
                    '@addoncrop/ffmpeg-helper',
                ],
            },
            watch: watchEnabled
                ? {
                        include: ['src/**/*'],
                        exclude: ['node_modules/**', 'src/app/**'],
                        clearScreen: false,
                    }
                : null,
        },
        plugins: [
            name === 'content' ? react() : null,
            analyzeEnabled
                ? analyzer({
                        analyzerMode: 'static',
                        fileName: `${name}-report.html`,
                    })
                : null,
            dts({
                rollupTypes: true,
                tsconfigPath: 'tsconfig.lib.json',
            }),
        ],
    };
}

async function run() {
    for (const [name, input] of objectEntries(entries)) {
        const entry = resolve(`src/core/${input}`);

        await build({
            configFile: false,
            ...createConfig(name, entry),
        });
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
