using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class EmailTemplateDTO
    {
        public int TemplateID { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string IsApproved { get; set; } = "Pending";
        public int CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateEmailTemplateDTO
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string TemplateName { get; set; } = string.Empty;
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Subject { get; set; } = string.Empty;
        [Required]
        [StringLength(20000, MinimumLength = 10)]
        public string Body { get; set; } = string.Empty;
    }

    public class UpdateEmailTemplateDTO : CreateEmailTemplateDTO { }

    public class EmailLogDTO
    {
        public int EmailLogID { get; set; }
        public string? CampaignName { get; set; }
        public string? LeadName { get; set; }
        public string? TemplateName { get; set; }
        public string? SentByName { get; set; }
        public DateTime SentDate { get; set; }
        public string Status { get; set; } = "Sent";
    }

    public class BulkSendDTO
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int CampaignID { get; set; }
        [Required]
        [Range(1, int.MaxValue)]
        public int TemplateID { get; set; }
        [Required]
        [MinLength(1, ErrorMessage = "Select at least one lead.")]
        public List<int> LeadIDs { get; set; } = new List<int>();
    }

    public class UpdateEmailLogStatusDTO
    {
        [Required]
        [RegularExpression("^(Pending|Sent|Failed)$", ErrorMessage = "Status must be Pending, Sent, or Failed.")]
        public string Status { get; set; } = string.Empty;
    }
}
