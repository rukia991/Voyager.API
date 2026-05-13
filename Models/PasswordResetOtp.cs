using System.ComponentModel.DataAnnotations;

namespace Voyager.API.Models
{
    public class PasswordResetOtp
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }
        public int FailedAttempts { get; set; }
        public string RequestedIpAddress { get; set; } = string.Empty;
        public User User { get; set; } = null!;
    }
}
