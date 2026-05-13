using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class CampaignDTO
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
        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public int LocationID { get; set; }
        public string? LocationName { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedDate { get; set; }
        public string? ArchivedByUserName { get; set; }
    }

    public class CreateCampaignDTO
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string CampaignName { get; set; } = string.Empty;
        [StringLength(2000)]
        public string? Description { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        [Url]
        [StringLength(2048)]
        public string? ImageUrl { get; set; }
        [Required]
        [Range(0, 999999999)]
        public decimal Budget { get; set; }
        [StringLength(500)]
        public string? TargetGoal { get; set; }
        [Required]
        [RegularExpression("^(Active|Inactive|Upcoming|Completed|Paused)$", ErrorMessage = "Status must be Active, Inactive, Upcoming, Completed, or Paused.")]
        public string Status { get; set; } = "Active";
        [Required]
        [Range(1, int.MaxValue)]
        public int LocationID { get; set; }
    }

    public class UpdateCampaignDTO : CreateCampaignDTO { }
}
