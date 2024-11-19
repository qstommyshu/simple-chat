export const autoCompleteUrl = (url: string): string => {
  const urlRegex = /^((http|https):\/\/)?(www\.)?([^/]+)(\/.*)?$/;
  const match = url.match(urlRegex);

  if (!match) {
    return '';
  }

  const [, , protocol, subdomain, domain, pathname] = match;

  const newProtocol = protocol || 'https:';

  const newSubdomain = subdomain || 'www.';

  const newPathname = pathname ? pathname.replace(/^\//, '/') : '';

  return `${newProtocol}//${newSubdomain}${domain}${newPathname}`;
}