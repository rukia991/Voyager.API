using Microsoft.AspNetCore.Identity;

namespace Voyager.API.Models
{
    public class User : IdentityUser<int>
    {
        public int TenantId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string? EncryptedPhoneNumber { get; set; }
        public string? EncryptedAddress { get; set; }
        public string Role { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = "Active";
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public ICollection<Campaign> CreatedCampaigns { get; set; } = new List<Campaign>();
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();
        public ICollection<PasswordResetOtp> PasswordResetOtps { get; set; } = new List<PasswordResetOtp>();
    }
}
