export const maskEmail = (email?: string | null) => {
  if (!email) {
    return 'Unknown';
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 1 || atIndex === email.length - 1) {
    return '***';
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (local.length <= 2) {
    return `${local[0]}***${domain}`;
  }

  return `${local.slice(0, 2)}***${local.slice(-1)}${domain}`;
};

export const maskIpAddress = (ipAddress?: string | null) => {
  if (!ipAddress) {
    return 'Unknown';
  }

  if (ipAddress.includes(':')) {
    const segments = ipAddress.split(':').filter(Boolean);
    if (segments.length <= 2) {
      return '****';
    }

    return `${segments[0]}:${segments[1]}:****`;
  }

  const parts = ipAddress.split('.');
  if (parts.length !== 4) {
    return ipAddress;
  }

  return `${parts[0]}.${parts[1]}.*.*`;
};
