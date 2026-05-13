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
        [StringLength(150, MinimumLength = 2)]
        public string LocationName { get; set; } = string.Empty;
        [StringLength(2000)]
        public string? Description { get; set; }
        [Required]
        [Range(-90, 90)]
        public decimal Latitude { get; set; }
        [Required]
        [Range(-180, 180)]
        public decimal Longitude { get; set; }
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Country { get; set; } = string.Empty;
    }
}
