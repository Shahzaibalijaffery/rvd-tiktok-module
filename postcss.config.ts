import type { Config } from 'postcss-load-config';

import tailwindCss from '@tailwindcss/postcss';
import extractProperties from './plugins/postcss-extract-css-proprties';
import remToPx from './plugins/postcss-rem-to-px-plugin';

export default {
    plugins: [
        tailwindCss({ optimize: false }),

        remToPx({
            baseValue: 16,
            only(file) { // only process files in the content scripts
                return file.includes('content/');
            },
        }),

        extractProperties({
            only(file) { // only process content script Base.css
                return file.includes('content/') && file.includes('Base.css');
            },
        }),
    ],
} satisfies Config;
