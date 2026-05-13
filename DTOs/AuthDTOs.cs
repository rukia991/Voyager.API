using System.ComponentModel.DataAnnotations;

namespace Voyager.API.DTOs
{
    public class RegisterDTO
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? MiddleName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [StringLength(24, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 24 characters.")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,24}$",
            ErrorMessage = "Password must be 12-24 characters and include an uppercase letter, a number, and a special character.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string RecaptchaToken { get; set; } = string.Empty;

        public string Role { get; set; } = "Customer";
    }

    public class LoginDTO
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string RecaptchaToken { get; set; } = string.Empty;
    }

    public class AuthResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime Expiry { get; set; }
    }

    public class LoginChallengeResponseDTO
    {
        public bool RequiresTwoFactor { get; set; }
        public string Email { get; set; } = string.Empty;
        public string MaskedEmail { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class VerifyLoginOtpDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be 6 digits.")]
        public string Otp { get; set; } = string.Empty;
    }

    public class ForgotPasswordDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordWithOtpDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be 6 digits.")]
        public string Otp { get; set; } = string.Empty;

        [Required]
        [StringLength(24, MinimumLength = 12, ErrorMessage = "New password must be between 12 and 24 characters.")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,24}$",
            ErrorMessage = "New password must be 12-24 characters and include an uppercase letter, a number, and a special character.")]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(24, MinimumLength = 12, ErrorMessage = "Confirm password must be between 12 and 24 characters.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
