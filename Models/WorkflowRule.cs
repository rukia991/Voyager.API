namespace Voyager.API.Models
{
    public class WorkflowRule
    {
        public int RuleID { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string TriggerEvent { get; set; } = string.Empty;
        public string? Condition { get; set; }
        public string? Action { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}