using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class SecurityDashboardDTO
    {
        public int SuspiciousLoginCount { get; set; }
        public int FailedLoginCount { get; set; }
        public int LockedAccountCount { get; set; }
        public List<SecurityAuditItemDTO> SuspiciousLogins { get; set; } = new();
        public List<SecurityAuditItemDTO> FailedAttempts { get; set; } = new();
        public List<SecurityAuditItemDTO> RecentSuccessfulLogins { get; set; } = new();
        public List<LockedAccountDTO> LockedAccounts { get; set; } = new();
    }

    public class SecurityAuditItemDTO
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class LockedAccountDTO
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int FailedAccessCount { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public string LastAttemptIpAddress { get; set; } = string.Empty;
        public DateTime? LastAttemptAt { get; set; }
    }

    public class UnlockAccountDTO
    {
        [Range(1, int.MaxValue)]
        public int? UserId { get; set; }

        [EmailAddress]
        public string? Email { get; set; }
    }
}
