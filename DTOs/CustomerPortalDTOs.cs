using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class CampaignOfferDTO
    {
        public int CampaignID { get; set; }
        public string CampaignName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TargetGoal { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? LocationName { get; set; }
        public string? Country { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsEnrolled { get; set; }
    }

    public class CustomerProfileDTO
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string LastName { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [StringLength(30)]
        public string PhoneNumber { get; set; } = string.Empty;
        [StringLength(300)]
        public string Address { get; set; } = string.Empty;
    }

    public class CustomerPreferencesDTO
    {
        public bool SubscribeLuxury { get; set; }
        public bool SubscribeCultural { get; set; }
        public bool SubscribeTropical { get; set; }
        public bool SubscribeAdventure { get; set; }
    }

    public class CampaignFeedbackDTO
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int CampaignID { get; set; }
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        [StringLength(2000)]
        public string? Comment { get; set; }
    }
}
