export const autoCompleteUrl = (url: string): string => {
  // Updated regex to require at least one dot in the domain
  const urlRegex = /^((http|https):\/\/)?(www\.)?([^\/\s]+\.[^\/\s]+)(\/.*)?$/;
  const match = url.match(urlRegex);

  if (!match || !match[4]) { // Ensure the match exists and has a domain part
    return '';
  }

  const [, protocol, , subdomain, domain, pathname] = match;

  // Use provided protocol or default to 'https://'
  const newProtocol = protocol || 'https://';

  // Only prepend 'www.' if it wasn't already present
  const newSubdomain = subdomain || (domain.includes('.') ? 'www.' : '');

  // Default pathname to an empty string if not present
  const newPathname = pathname || '';

  return `${newProtocol}${newSubdomain}${domain}${newPathname}`;
};
