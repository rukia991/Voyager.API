namespace Voyager.API.Models
{
    public class CampaignLocation
    {
        public int LocationID { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string Country { get; set; } = string.Empty;
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchivedDate { get; set; }
        public int? ArchivedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public User? Archiver { get; set; }

        // Navigation
        public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
    }
}