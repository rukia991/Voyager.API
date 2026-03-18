using System.ComponentModel.DataAnnotations;

namespace Voyager.API.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Details { get; set; } = string.Empty;

        public User User { get; set; } = null!;
    }
}
