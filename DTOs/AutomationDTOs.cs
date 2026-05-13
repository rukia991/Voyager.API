using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class WorkflowRuleDTO
    {
        public int RuleID { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string TriggerEvent { get; set; } = string.Empty;
        public string? Condition { get; set; }
        public string? Action { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateWorkflowRuleDTO
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string RuleName { get; set; } = string.Empty;
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string TriggerEvent { get; set; } = string.Empty;
        [StringLength(1000)]
        public string? Condition { get; set; }
        [StringLength(1000)]
        public string? Action { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class IntegrationSettingsDTO
    {
        public string GoogleMapsApiKey { get; set; } = string.Empty;
        public string EmailSmtpHost { get; set; } = string.Empty;
        public int EmailSmtpPort { get; set; }
        public string EmailSender { get; set; } = string.Empty;
    }
}
