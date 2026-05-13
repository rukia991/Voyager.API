using Microsoft.Extensions.Caching.Memory;
using Voyager.API.Models;

namespace Voyager.API.Services
{
    public sealed class LoginTwoFactorService : ILoginTwoFactorService
    {
        private const int OtpLength = 6;
        private const int MaxFailedAttempts = 5;
        private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(5);

        private readonly IMemoryCache _memoryCache;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LoginTwoFactorService> _logger;

        public LoginTwoFactorService(
            IMemoryCache memoryCache,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<LoginTwoFactorService> logger)
        {
            _memoryCache = memoryCache;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendOtpAsync(User user, string ipAddress)
        {
            await StoreAndSendOtpAsync(user, ipAddress);
        }

        public async Task ResendOtpAsync(User user, string ipAddress)
        {
            await StoreAndSendOtpAsync(user, ipAddress);
        }

        public Task<LoginTwoFactorVerificationResult> VerifyOtpAsync(User user, string otp)
        {
            var cacheKey = GetCacheKey(user.Id);
            if (!_memoryCache.TryGetValue<LoginTwoFactorChallenge>(cacheKey, out var challenge) || challenge == null)
            {
                return Task.FromResult(new LoginTwoFactorVerificationResult
                {
                    ErrorCode = "OTP_NOT_FOUND",
                    Message = "No active login verification code was found. Please sign in again."
                });
            }

            if (challenge.ExpiresAtUtc <= DateTime.UtcNow)
            {
                _memoryCache.Remove(cacheKey);
                return Task.FromResult(new LoginTwoFactorVerificationResult
                {
                    ErrorCode = "OTP_EXPIRED",
                    Message = "The verification code has expired. Please sign in again."
                });
            }

            if (challenge.FailedAttempts >= MaxFailedAttempts)
            {
                _memoryCache.Remove(cacheKey);
                return Task.FromResult(new LoginTwoFactorVerificationResult
                {
                    ErrorCode = "OTP_LIMIT_REACHED",
                    Message = "Too many invalid verification attempts. Please sign in again."
                });
            }

            if (!BCrypt.Net.BCrypt.Verify(otp.Trim(), challenge.CodeHash))
            {
                challenge.FailedAttempts += 1;
                _memoryCache.Set(cacheKey, challenge, challenge.ExpiresAtUtc);

                return Task.FromResult(new LoginTwoFactorVerificationResult
                {
                    ErrorCode = challenge.FailedAttempts >= MaxFailedAttempts ? "OTP_LIMIT_REACHED" : "INVALID_OTP",
                    Message = challenge.FailedAttempts >= MaxFailedAttempts
                        ? "Too many invalid verification attempts. Please sign in again."
                        : "Invalid verification code."
                });
            }

            _memoryCache.Remove(cacheKey);
            return Task.FromResult(new LoginTwoFactorVerificationResult
            {
                IsSuccess = true
            });
        }

        public string MaskEmail(string email)
        {
            var atIndex = email.IndexOf('@');
            if (atIndex <= 1)
            {
                return email;
            }

            var prefix = email[..atIndex];
            var domain = email[atIndex..];
            return $"{prefix[0]}***{prefix[^1]}{domain}";
        }

        private async Task StoreAndSendOtpAsync(User user, string ipAddress)
        {
            var otp = Random.Shared.Next(100000, 999999).ToString();
            var expiresAtUtc = DateTime.UtcNow.Add(OtpLifetime);
            var cacheKey = GetCacheKey(user.Id);

            var challenge = new LoginTwoFactorChallenge
            {
                CodeHash = BCrypt.Net.BCrypt.HashPassword(otp),
                ExpiresAtUtc = expiresAtUtc,
                FailedAttempts = 0,
                RequestedIpAddress = ipAddress
            };

            _memoryCache.Set(cacheKey, challenge, expiresAtUtc);

            var recipientEmail = ResolveRecipientEmail(user);
            var recipientName = $"{user.FirstName} {user.LastName}".Trim();
            var htmlBody =
                $"<p>Hello {user.FirstName},</p>" +
                $"<p>Your Voyager login verification code is <strong>{otp}</strong>.</p>" +
                $"<p>This code expires in {(int)OtpLifetime.TotalMinutes} minutes.</p>" +
                "<p>If this was not you, please change your password immediately.</p>";

            await _emailService.SendAsync(recipientEmail, string.IsNullOrWhiteSpace(recipientName) ? recipientEmail : recipientName, "Voyager Login Verification Code", htmlBody);
            _logger.LogInformation("Login OTP sent for account {AccountEmail} to destination {DestinationEmail}", user.Email, recipientEmail);
        }

        private static string GetCacheKey(int userId) => $"login-2fa:{userId}";

        private string ResolveRecipientEmail(User user)
        {
            var accountEmail = user.Email?.Trim() ?? string.Empty;
            var senderEmail = _configuration["Email:Sender"]?.Trim() ?? string.Empty;

            var isSeededAdminAccount =
                string.Equals(accountEmail, "admin@voyagerplus.com", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(accountEmail, "superadmin@voyagerplus.com", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(accountEmail, "manager@voyagerplus.com", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(accountEmail, "staff@voyagerplus.com", StringComparison.OrdinalIgnoreCase);

            if (isSeededAdminAccount && !string.IsNullOrWhiteSpace(senderEmail))
            {
                return senderEmail;
            }

            return accountEmail;
        }

        private sealed class LoginTwoFactorChallenge
        {
            public string CodeHash { get; set; } = string.Empty;
            public DateTime ExpiresAtUtc { get; set; }
            public int FailedAttempts { get; set; }
            public string RequestedIpAddress { get; set; } = string.Empty;
        }
    }
}
