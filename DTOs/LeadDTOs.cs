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
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastContactDate { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedDate { get; set; }
        public string? ArchivedByUserName { get; set; }
        public List<LeadEnrollmentDTO> EnrollmentHistory { get; set; } = new List<LeadEnrollmentDTO>();
    }

    public class LeadEnrollmentDTO
    {
        public int CampaignID { get; set; }
        public string CampaignName { get; set; } = string.Empty;
        public DateTime EnrolledDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateLeadDTO
    {
        [EmailAddress]
        public string? Email { get; set; }
        [StringLength(150, MinimumLength = 2)]
        public string? FullName { get; set; }
        [Required]
        [Range(1, int.MaxValue)]
        public int CampaignID { get; set; }
        [Required]
        [RegularExpression("^(New|Contacted|Qualified|Lost|Converted|Enrolled)$", ErrorMessage = "Lead status is invalid.")]
        public string LeadStatus { get; set; } = "New";
        [Range(0, 100)]
        public int LeadScore { get; set; } = 0;
        [StringLength(100)]
        public string? Source { get; set; }
        [StringLength(2000)]
        public string? Notes { get; set; }
        [Range(1, int.MaxValue)]
        public int? UserID { get; set; }
    }

    public class UpdateLeadDTO
    {
        [Required]
        [RegularExpression("^(New|Contacted|Qualified|Lost|Converted|Enrolled)$", ErrorMessage = "Lead status is invalid.")]
        public string LeadStatus { get; set; } = "New";
        [Range(0, 100)]
        public int LeadScore { get; set; }
        [StringLength(2000)]
        public string? Notes { get; set; }
        [StringLength(100)]
        public string? Source { get; set; }
        public DateTime? LastContactDate { get; set; }
    }
}
