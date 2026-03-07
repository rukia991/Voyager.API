using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class LocationDTO
    {
        public int LocationID { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string Country { get; set; } = string.Empty;
        public bool IsArchived { get; set; }
        public DateTime? ArchivedDate { get; set; }
        public string? ArchivedByUserName { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateLocationDTO
    {
        [Required]
        public string LocationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required]
        public decimal Latitude { get; set; }
        [Required]
        public decimal Longitude { get; set; }
        [Required]
        public string Country { get; set; } = string.Empty;
    }
}
