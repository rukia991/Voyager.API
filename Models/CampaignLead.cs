namespace Voyager.API.Models
{
    public class CampaignLead
    {
        public int CampaignLeadID { get; set; }
        public int TenantId { get; set; }
        public int CampaignID { get; set; }
        public int LeadID { get; set; }
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Campaign Campaign { get; set; } = null!;
        public Lead Lead { get; set; } = null!;
    }
}