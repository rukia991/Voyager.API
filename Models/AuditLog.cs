using System.ComponentModel.DataAnnotations;

namespace Voyager.API.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        public int? UserId { get; set; }        // nullable - failed logins have no valid user
        public string Email { get; set; } = string.Empty;  // log email regardless
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;

        // Security fields
        public string IpAddress { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsSuccess { get; set; }
        public bool IsSuspicious { get; set; } = false;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}