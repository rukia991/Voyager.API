namespace Voyager.API.Models
{
    public class Tenant
    {
        public int TenantId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string SubscriptionPlan { get; set; } = "Basic";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
        public ICollection<CampaignLocation> Locations { get; set; } = new List<CampaignLocation>();
        public ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();
        public ICollection<Analytics> Analytics { get; set; } = new List<Analytics>();
    }
}
