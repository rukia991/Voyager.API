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
    }

    public class CreateCampaignDTO
    {
        [Required]
        public string CampaignName { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        [Required]
        public decimal Budget { get; set; }
        public string? TargetGoal { get; set; }
        public string Status { get; set; } = "Active";
        [Required]
        public int LocationID { get; set; }
    }

    public class UpdateCampaignDTO : CreateCampaignDTO { }
}
