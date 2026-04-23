import type { Declaration, PluginCreator } from 'postcss';

export interface Options {
    baseValue?: number;
    only?: (file: string) => boolean;
}

/**
 * Converts rem units to px based on a specified base value for better compatibility in content scripts.
 */
const remToPx: PluginCreator<Options> = (opts = {}) => {
    const baseValue = opts.baseValue ?? 16;
    const unit = 'px';

    let enabled = false;

    return {
        postcssPlugin: 'postcss-rem-to-px',

        Once(root) {
            const file = root.source?.input.file;

            if (file && opts.only) {
                enabled = opts.only(file);
            }
        },

        Declaration(decl: Declaration) {
            if (!enabled)
                return;

            decl.value = decl.value.replace(
                /"[^"]+"|'[^']+'|url\([^)]+\)|(-?(?:\d+(?:\.\d+)?|\.\d+))rem/g,
                (match, p1) => {
                    if (p1 === undefined)
                        return match;
                    return `${Number(p1) * baseValue}${p1 === 0 ? '' : unit}`;
                },
            );
        },
    };
};

remToPx.postcss = true;

export default remToPx;
