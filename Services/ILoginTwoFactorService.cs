using Voyager.API.Models;

namespace Voyager.API.Services
{
    public interface ILoginTwoFactorService
    {
        Task SendOtpAsync(User user, string ipAddress);
        Task ResendOtpAsync(User user, string ipAddress);
        Task<LoginTwoFactorVerificationResult> VerifyOtpAsync(User user, string otp);
        string MaskEmail(string email);
    }

    public sealed class LoginTwoFactorVerificationResult
    {
        public bool IsSuccess { get; init; }
        public string ErrorCode { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }
}
