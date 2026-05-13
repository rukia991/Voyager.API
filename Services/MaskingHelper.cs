namespace Voyager.API.Services
{
    public static class MaskingHelper
    {
        public static string MaskEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return string.Empty;
            }

            var atIndex = email.IndexOf('@');
            if (atIndex <= 1 || atIndex == email.Length - 1)
            {
                return "***";
            }

            var local = email[..atIndex];
            var domain = email[atIndex..];

            if (local.Length <= 2)
            {
                return $"{local[0]}***{domain}";
            }

            return $"{local[..2]}***{local[^1]}{domain}";
        }

        public static string MaskIpAddress(string? ipAddress)
        {
            if (string.IsNullOrWhiteSpace(ipAddress))
            {
                return "Unknown";
            }

            if (ipAddress.Contains(':'))
            {
                var segments = ipAddress.Split(':', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length <= 2)
                {
                    return "****";
                }

                return $"{segments[0]}:{segments[1]}:****";
            }

            var parts = ipAddress.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 4)
            {
                return ipAddress;
            }

            return $"{parts[0]}.{parts[1]}.*.*";
        }
    }
}
