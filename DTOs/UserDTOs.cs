using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = "Active";
        public DateTime CreatedDate { get; set; }
    }

    public class CreateUserDTO
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string LastName { get; set; } = string.Empty;
        [Required]
        public string Role { get; set; } = string.Empty;
        [Required]
        [StringLength(24, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 24 characters.")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,24}$",
            ErrorMessage = "Password must be 12-24 characters and include an uppercase letter, a number, and a special character.")]
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserRoleDTO
    {
        [Required]
        [StringLength(50)]
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateUserStatusDTO
    {
        [Required]
        [RegularExpression("^(Active|Suspended)$", ErrorMessage = "Status must be Active or Suspended.")]
        public string Status { get; set; } = string.Empty;
    }

    public class AuditLogDTO
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Details { get; set; } = string.Empty;
    }
}
