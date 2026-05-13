namespace Voyager.API.Models
{
    public class GeoResult
    {
        public string? Status { get; set; }
        public string? Country { get; set; }
        public string? City { get; set; }
        public double? Lat { get; set; }
        public double? Lon { get; set; }
    }
}