using System.ComponentModel.DataAnnotations;

namespace Voyager.API.Models
{
    public class Tenant
    {
        [Key]
        public int TenantId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? SubscriptionPlan { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
        public ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
