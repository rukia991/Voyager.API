namespace Voyager.API.Models
{
    public class Campaign
    {
        public int CampaignID { get; set; }
        public string CampaignName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Budget { get; set; }
        public string? TargetGoal { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchivedDate { get; set; }
        public int? ArchivedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public int CreatedBy { get; set; }
        public int LocationID { get; set; }

        // Navigation
        public User Creator { get; set; } = null!;
        public User? Archiver { get; set; }
        public CampaignLocation Location { get; set; } = null!;
        public ICollection<CampaignLead> CampaignLeads { get; set; } = new List<CampaignLead>();
        public ICollection<EmailLog> EmailLogs { get; set; } = new List<EmailLog>();
        public ICollection<Analytics> Analytics { get; set; } = new List<Analytics>();
    }
}
