namespace Voyager.API.Models
{
    public class Lead
    {
        public int LeadID { get; set; }
        public int? UserID { get; set; }
        public int CampaignID { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string LeadStatus { get; set; } = "New";
        public int LeadScore { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchivedDate { get; set; }
        public int? ArchivedBy { get; set; }
        public DateTime? LastContactDate { get; set; }

        // Navigation
        public User? User { get; set; }
        public User? Archiver { get; set; }
        public Campaign Campaign { get; set; } = null!;
        public ICollection<CampaignLead> CampaignLeads { get; set; } = new List<CampaignLead>();
        public ICollection<EmailLog> EmailLogs { get; set; } = new List<EmailLog>();
    }
}