namespace Voyager.API.Models
{
    public class EmailLog
    {
        public int EmailLogID { get; set; }
        public int CampaignID { get; set; }
        public int LeadID { get; set; }
        public int TemplateID { get; set; }
        public int SentBy { get; set; }
        public DateTime SentDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Sent";
        public string EmailStatus { get; set; } = "Sent";

        // Navigation
        public Campaign Campaign { get; set; } = null!;
        public Lead Lead { get; set; } = null!;
        public EmailTemplate Template { get; set; } = null!;
        public User SentByUser { get; set; } = null!;
    }
}