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
        public string RuleName { get; set; } = string.Empty;
        [Required]
        public string TriggerEvent { get; set; } = string.Empty;
        public string? Condition { get; set; }
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
