namespace Voyager.API.Models
{
    public class EmailTemplate
    {
        public int TemplateID { get; set; }
        public int TenantId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string IsApproved { get; set; } = "Pending";
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public User Creator { get; set; } = null!;
        public ICollection<EmailLog> EmailLogs { get; set; } = new List<EmailLog>();
    }
}
