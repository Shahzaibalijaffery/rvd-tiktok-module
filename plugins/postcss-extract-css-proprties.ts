import type { PluginCreator } from 'postcss';

export interface Options {
    only?: (file: string) => boolean;
}

/**
 * Extracts CSS custom properties and property rules from :root selector to facilitate their use in shadow DOM.
 */
const extractProperties: PluginCreator<Options> = (opts = {}) => {
    return {
        postcssPlugin: 'postcss-extract-properties',

        Once(root) {
            const file = root.source?.input.file;

            if (opts.only && file && !opts.only(file)) {
                return;
            }

            root.walkRules((rule) => {
                // Remove any rule that isn't the :root selector
                if (rule.selector !== ':root') {
                    rule.remove();
                }
            });

            root.walkAtRules((atRule) => {
                // Keep @property, remove everything else
                if (atRule.name !== 'property') {
                    atRule.remove();
                }
            });
        },
    };
};

extractProperties.postcss = true;

export default extractProperties;
