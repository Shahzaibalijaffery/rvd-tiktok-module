const substitutionPattern = /\$(\w+)\$/g;

function __t(key: string, defaultValue: string, substitutions?: string[]) {
    let message = chrome.i18n.getMessage(key, substitutions);

    if (!message) {
        console.warn(`Missing translation for key: ${key}`);

        message = defaultValue;

        if (substitutions) {
            let cnt = 0;

            message = message.replace(substitutionPattern, placeholder => (substitutions[cnt++] || placeholder));
        }
    }

    return message;
};

export { __t };
