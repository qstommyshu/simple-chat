import urlParse from 'url-parse';

const DEFAULT_PROTOCOL = 'https:';
const DEFAULT_HOST = 'www.';

export const completeURL = (inputURL: string): string => {
    const parsedURL = urlParse(inputURL, {}, true);

    if (!parsedURL.protocol) {
        parsedURL.set('protocol', DEFAULT_PROTOCOL);
    }

    if (!parsedURL.hostname.startsWith(DEFAULT_HOST)) {
        parsedURL.set('hostname', DEFAULT_HOST + parsedURL.hostname);
    } else {
        parsedURL.set('hostname', parsedURL.hostname);
    }

    return parsedURL.href;
};
