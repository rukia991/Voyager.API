using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class LeadDTO
    {
        public int LeadID { get; set; }
        public int? UserID { get; set; }
        public string? UserName { get; set; }
        public int CampaignID { get; set; }
        public string? CampaignName { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string LeadStatus { get; set; } = "New";
        public int LeadScore { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastContactDate { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedDate { get; set; }
        public string? ArchivedByUserName { get; set; }
    }

    public class CreateLeadDTO
    {
        public string? Email { get; set; }
        public string? FullName { get; set; }
        [Required]
        public int CampaignID { get; set; }
        public string LeadStatus { get; set; } = "New";
        public int LeadScore { get; set; } = 0;
        public string? Source { get; set; }
        public string? Notes { get; set; }
        public int? UserID { get; set; }
    }

    public class UpdateLeadDTO
    {
        [Required]
        public string LeadStatus { get; set; } = "New";
        public int LeadScore { get; set; }
        public string? Notes { get; set; }
        public string? Source { get; set; }
        public DateTime? LastContactDate { get; set; }
    }
}
