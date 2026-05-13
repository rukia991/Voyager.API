using BCrypt.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;
using Voyager.API.Services;

namespace Voyager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly VoyagerDbContext _context;
        private readonly IRecaptchaService _recaptchaService;
        private readonly IEmailService _emailService;
        private readonly ILoginTwoFactorService _loginTwoFactorService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly int _maxLoginAttempts;
        private readonly int _lockoutMinutes;
        private readonly int _failedAttemptCooldownBaseSeconds;

        public AuthController(
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            IConfiguration configuration,
            VoyagerDbContext context,
            IRecaptchaService recaptchaService,
            IEmailService emailService,
            ILoginTwoFactorService loginTwoFactorService,
            IHttpClientFactory httpClientFactory)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;
            _recaptchaService = recaptchaService;
            _emailService = emailService;
            _loginTwoFactorService = loginTwoFactorService;
            _httpClientFactory = httpClientFactory;
            _maxLoginAttempts = _configuration.GetValue("Security:MaxFailedAccessAttempts", 5);
            _lockoutMinutes = _configuration.GetValue("Security:LockoutMinutes", 30);
            _failedAttemptCooldownBaseSeconds = _configuration.GetValue("Security:FailedAttemptCooldownBaseSeconds",
                _configuration.GetValue("Security:FailedAttemptCooldownBaseMinutes", 1) * 60);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            var ipAddress = GetRequestIpAddress();
            var isRecaptchaValid = await _recaptchaService.VerifyAsync(dto.RecaptchaToken, "register", ipAddress);
            if (!isRecaptchaValid)
            {
                return ApiBadRequest("reCAPTCHA validation failed.", "RECAPTCHA_FAILED");
            }

            var requestedRole = string.Equals(dto.Role, "Client", StringComparison.OrdinalIgnoreCase)
                ? "Customer"
                : dto.Role;

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return ApiConflict("Email already exists.", "EMAIL_ALREADY_EXISTS");
            }

            var tenantId = await _context.Tenants
                .OrderBy(t => t.TenantId)
                .Select(t => t.TenantId)
                .FirstOrDefaultAsync();

            if (tenantId == 0)
            {
                return StatusCode(500, new ApiErrorResponse
                {
                    Message = "No tenant is configured for user registration.",
                    Code = "TENANT_NOT_CONFIGURED"
                });
            }

            var user = new User
            {
                TenantId = tenantId,
                FirstName = dto.FirstName.Trim(),
                MiddleName = dto.MiddleName?.Trim(),
                LastName = dto.LastName.Trim(),
                Email = dto.Email.Trim(),
                UserName = dto.UserName.Trim(),
                Role = requestedRole,
                AccountStatus = "Active",
                CreatedDate = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return ApiBadRequest(
                    "User registration failed.",
                    "REGISTRATION_FAILED",
                    result.Errors.Select(error => error.Description).ToArray());
            }

            var roleExists = await _roleManager.RoleExistsAsync(requestedRole);
            if (roleExists)
            {
                await _userManager.AddToRoleAsync(user, requestedRole);
            }

            await LogAuditAsync(user.Id, dto.Email, ipAddress, "Register", true, "User registered successfully");
            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            var ipAddress = GetRequestIpAddress();
            var isRecaptchaValid = await _recaptchaService.VerifyAsync(dto.RecaptchaToken, "login", ipAddress);
            if (!isRecaptchaValid)
            {
                return ApiBadRequest("reCAPTCHA validation failed.", "RECAPTCHA_FAILED");
            }

            var user = await _userManager.FindByEmailAsync(dto.Email)
                       ?? await _userManager.FindByNameAsync(dto.Email);

            if (user == null)
            {
                await LogAuditAsync(null, dto.Email, ipAddress, "Login", false, "User not found");
                return ApiUnauthorized("Invalid email or password.", "INVALID_CREDENTIALS");
            }

            user = await EnsurePermanentLockIfThresholdReachedAsync(user);

            if (await _userManager.IsLockedOutAsync(user))
            {
                var isPermanentlyLocked = user.LockoutEnd == DateTimeOffset.MaxValue;
                await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login", false, "Account locked out");
                if (isPermanentlyLocked)
                {
                    return ApiUnauthorized("Account is permanently locked. Please contact an administrator.", "ACCOUNT_LOCKED");
                }

                var secondsRemaining = GetLockoutSecondsRemaining(user.LockoutEnd);
                return ApiUnauthorized($"Account is locked. Try again in {secondsRemaining} second(s).", "ACCOUNT_LOCKED");
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
            {
                var expectedFailedCount = user.AccessFailedCount + 1;
                await _userManager.AccessFailedAsync(user);
                await _userManager.UpdateSecurityStampAsync(user);

                var refreshedUser = await _userManager.FindByIdAsync(user.Id.ToString());
                var failedCount = Math.Max(expectedFailedCount, refreshedUser?.AccessFailedCount ?? 0);
                var attemptsLeft = Math.Max(0, _maxLoginAttempts - failedCount);

                if (refreshedUser != null && expectedFailedCount >= _maxLoginAttempts)
                {
                    await _userManager.SetLockoutEndDateAsync(refreshedUser, DateTimeOffset.MaxValue);
                    refreshedUser = await EnsurePermanentLockIfThresholdReachedAsync(refreshedUser);
                    failedCount = Math.Max(failedCount, expectedFailedCount);
                }

                if (refreshedUser != null && refreshedUser.LockoutEnd == DateTimeOffset.MaxValue)
                {
                    await LogAuditAsync(
                        user.Id,
                        dto.Email,
                        ipAddress,
                        "Login",
                        false,
                        $"Account permanently locked after {_maxLoginAttempts} failed attempts");

                    return Unauthorized(new
                    {
                        message = $"Account permanently locked after {_maxLoginAttempts} failed attempts. Please contact an administrator.",
                        code = "ACCOUNT_LOCKED"
                    });
                }

                if (refreshedUser != null)
                {
                    var cooldownSeconds = GetFailedAttemptCooldownSeconds(failedCount);
                    await _userManager.SetLockoutEndDateAsync(refreshedUser, DateTimeOffset.UtcNow.AddSeconds(cooldownSeconds));
                    refreshedUser = await _userManager.FindByIdAsync(user.Id.ToString());

                    await LogAuditAsync(
                        user.Id,
                        dto.Email,
                        ipAddress,
                        "Login",
                        false,
                        $"Invalid password. Attempt {failedCount} of {_maxLoginAttempts}. Try again in {cooldownSeconds} second(s).");

                    return Unauthorized(new ApiErrorResponse
                    {
                        Message = $"Invalid email or password. Try again in {cooldownSeconds} second(s). {attemptsLeft} attempt(s) left before permanent lock.",
                        Code = "ATTEMPT_COOLDOWN"
                    });
                }

                await LogAuditAsync(
                    user.Id,
                    dto.Email,
                    ipAddress,
                    "Login",
                    false,
                    $"Invalid password. Attempts left: {attemptsLeft}");

                return ApiUnauthorized($"Invalid email or password. {attemptsLeft} attempts left before lockout.", "INVALID_CREDENTIALS");
            }

            if (user.AccountStatus != "Active")
            {
                await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login", false, "Account inactive");
                return ApiUnauthorized("Account is inactive or suspended.", "ACCOUNT_INACTIVE");
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            await _loginTwoFactorService.SendOtpAsync(user, ipAddress);
            await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login2FA", true, "Login verification code sent");

            return Ok(new LoginChallengeResponseDTO
            {
                RequiresTwoFactor = true,
                Email = user.Email ?? string.Empty,
                MaskedEmail = _loginTwoFactorService.MaskEmail(user.Email ?? string.Empty),
                Message = "A login verification code has been sent to your email."
            });
        }

        [HttpPost("verify-login-otp")]
        public async Task<IActionResult> VerifyLoginOtp([FromBody] VerifyLoginOtpDTO dto)
        {
            var ipAddress = GetRequestIpAddress();
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (user == null)
            {
                return ApiUnauthorized("Invalid verification request.", "INVALID_OTP");
            }

            user = await EnsurePermanentLockIfThresholdReachedAsync(user);

            if (await _userManager.IsLockedOutAsync(user))
            {
                var isPermanentlyLocked = user.LockoutEnd == DateTimeOffset.MaxValue;
                if (isPermanentlyLocked)
                {
                    return ApiUnauthorized("Account is permanently locked. Please contact an administrator.", "ACCOUNT_LOCKED");
                }

                var secondsRemaining = GetLockoutSecondsRemaining(user.LockoutEnd);
                return ApiUnauthorized($"Account is locked. Try again in {secondsRemaining} second(s).", "ACCOUNT_LOCKED");
            }

            var verification = await _loginTwoFactorService.VerifyOtpAsync(user, dto.Otp);
            if (!verification.IsSuccess)
            {
                await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login2FA", false, verification.Message);
                return ApiUnauthorized(verification.Message, verification.ErrorCode);
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";
            var token = GenerateJwtToken(user, role);
            var expiry = DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:ExpiryInDays"]!));

            var loginAudit = await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login", true, "Login successful with 2FA");
            await CheckGeoAnomalyAsync(user.Id, dto.Email, ipAddress, loginAudit.Country);

            return Ok(new AuthResponseDTO
            {
                Token = token,
                UserName = user.UserName ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                DisplayName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email ?? string.Empty,
                Role = role,
                Expiry = expiry
            });
        }

        [HttpPost("resend-login-otp")]
        public async Task<IActionResult> ResendLoginOtp([FromBody] ForgotPasswordDTO dto)
        {
            var ipAddress = GetRequestIpAddress();
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (user == null)
            {
                return Ok(new { message = "If the email is registered, a verification code has been sent." });
            }

            user = await EnsurePermanentLockIfThresholdReachedAsync(user);

            if (await _userManager.IsLockedOutAsync(user))
            {
                var isPermanentlyLocked = user.LockoutEnd == DateTimeOffset.MaxValue;
                if (isPermanentlyLocked)
                {
                    return ApiUnauthorized("Account is permanently locked. Please contact an administrator.", "ACCOUNT_LOCKED");
                }

                var secondsRemaining = GetLockoutSecondsRemaining(user.LockoutEnd);
                return ApiUnauthorized($"Account is locked. Try again in {secondsRemaining} second(s).", "ACCOUNT_LOCKED");
            }

            await _loginTwoFactorService.ResendOtpAsync(user, ipAddress);
            await LogAuditAsync(user.Id, dto.Email, ipAddress, "Login2FA", true, "Login verification code resent");
            return Ok(new { message = "A new verification code has been sent." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            var ipAddress = GetRequestIpAddress();
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());

            if (user != null)
            {
                var otp = Random.Shared.Next(100000, 999999).ToString();

                var activeOtps = await _context.PasswordResetOtps
                    .Where(x => x.UserId == user.Id && x.UsedAtUtc == null)
                    .ToListAsync();

                foreach (var activeOtp in activeOtps)
                {
                    activeOtp.UsedAtUtc = DateTime.UtcNow;
                }

                _context.PasswordResetOtps.Add(new PasswordResetOtp
                {
                    UserId = user.Id,
                    Email = user.Email ?? dto.Email.Trim(),
                    CodeHash = BCrypt.Net.BCrypt.HashPassword(otp),
                    CreatedAtUtc = DateTime.UtcNow,
                    ExpiresAtUtc = DateTime.UtcNow.AddMinutes(5),
                    RequestedIpAddress = ipAddress
                });

                await _context.SaveChangesAsync();

                var htmlBody =
                    $"<p>Hello {user.FirstName},</p>" +
                    $"<p>Your Voyager password reset code is <strong>{otp}</strong>.</p>" +
                    "<p>This code will expire in 5 minutes.</p>" +
                    "<p>If you did not request this, you can ignore this email.</p>";

                await _emailService.SendAsync(user.Email ?? dto.Email.Trim(), user.FirstName, "Voyager Password Reset OTP", htmlBody);
                await LogAuditAsync(user.Id, dto.Email, ipAddress, "ForgotPassword", true, "Password reset OTP sent");
            }

            return Ok(new { message = "If the email is registered, a password reset OTP has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordWithOtpDTO dto)
        {
            if (!string.Equals(dto.NewPassword, dto.ConfirmPassword, StringComparison.Ordinal))
            {
                return ApiBadRequest("New password and confirm password do not match.", "PASSWORD_MISMATCH");
            }

            var ipAddress = GetRequestIpAddress();
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (user == null)
            {
                return ApiBadRequest("Invalid OTP or email.", "INVALID_OTP");
            }

            var otpRecord = await _context.PasswordResetOtps
                .Where(x => x.UserId == user.Id && x.UsedAtUtc == null)
                .OrderByDescending(x => x.CreatedAtUtc)
                .FirstOrDefaultAsync();

            if (otpRecord == null || otpRecord.ExpiresAtUtc < DateTime.UtcNow)
            {
                return ApiBadRequest("OTP has expired. Please request a new code.", "OTP_EXPIRED");
            }

            if (otpRecord.FailedAttempts >= 5)
            {
                return ApiBadRequest("OTP verification limit reached. Please request a new code.", "OTP_LIMIT_REACHED");
            }

            var isOtpValid = BCrypt.Net.BCrypt.Verify(dto.Otp.Trim(), otpRecord.CodeHash);
            if (!isOtpValid)
            {
                otpRecord.FailedAttempts += 1;
                await _context.SaveChangesAsync();

                await LogAuditAsync(user.Id, dto.Email, ipAddress, "ResetPassword", false, "Invalid password reset OTP");
                return ApiBadRequest("Invalid OTP or email.", "INVALID_OTP");
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);
            if (!result.Succeeded)
            {
                return ApiBadRequest(
                    "Password reset failed.",
                    "PASSWORD_RESET_FAILED",
                    result.Errors.Select(error => error.Description).ToArray());
            }

            otpRecord.UsedAtUtc = DateTime.UtcNow;
            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.ResetAccessFailedCountAsync(user);
            await _userManager.UpdateSecurityStampAsync(user);
            await _context.SaveChangesAsync();

            await LogAuditAsync(user.Id, dto.Email, ipAddress, "ResetPassword", true, "Password reset completed");
            return Ok(new { message = "Password reset successful." });
        }

        private string GenerateJwtToken(User user, string role)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Role, role),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry = DateTime.UtcNow.AddDays(int.Parse(jwtSettings["ExpiryInDays"]!));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiry,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<AuditLog> LogAuditAsync(int? userId, string email, string ipAddress,
            string action, bool isSuccess, string details, bool isSuspicious = false)
        {
            var (country, city, lat, lon) = await GetGeoLocationAsync(ipAddress);

            var auditLog = new AuditLog
            {
                UserId = userId,
                Email = email,
                Action = action,
                Module = "Auth",
                Details = details,
                IpAddress = ipAddress,
                Country = country,
                City = city,
                Latitude = lat,
                Longitude = lon,
                IsSuccess = isSuccess,
                IsSuspicious = isSuspicious,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
            return auditLog;
        }

        private async Task CheckGeoAnomalyAsync(int userId, string email, string currentIp, string currentCountry)
        {
            if (string.IsNullOrWhiteSpace(currentCountry))
            {
                return;
            }

            var recentLogs = await _context.AuditLogs
                .Where(l => l.UserId == userId
                    && l.Action == "Login"
                    && l.IsSuccess
                    && !l.IsSuspicious
                    && l.Timestamp > DateTime.UtcNow.AddMinutes(-10))
                .ToListAsync();

            var hasOtherRecentCountry = recentLogs
                .Select(l => l.Country)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Any(c => !string.Equals(c, currentCountry, StringComparison.OrdinalIgnoreCase));

            if (hasOtherRecentCountry)
            {
                await LogAuditAsync(
                    userId,
                    email,
                    currentIp,
                    "Login",
                    true,
                    "SUSPICIOUS: Login from multiple countries detected",
                    isSuspicious: true);
            }
        }

        private async Task<(string Country, string City, double? Latitude, double? Longitude)> GetGeoLocationAsync(string ipAddress)
        {
            try
            {
                using var client = _httpClientFactory.CreateClient();
                var geo = await client.GetFromJsonAsync<GeoResult>($"http://ip-api.com/json/{ipAddress}");
                if (geo != null && geo.Status == "success")
                {
                    return (geo.Country ?? string.Empty, geo.City ?? string.Empty, geo.Lat, geo.Lon);
                }
            }
            catch
            {
            }

            return (string.Empty, string.Empty, null, null);
        }

        private string GetRequestIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
            {
                var firstForwarded = forwardedFor
                    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(firstForwarded))
                {
                    return firstForwarded;
                }
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private int GetLockoutSecondsRemaining(DateTimeOffset? lockoutEnd)
        {
            if (lockoutEnd == null)
            {
                return Math.Max(1, _failedAttemptCooldownBaseSeconds);
            }

            return Math.Max(1, (int)Math.Ceiling((lockoutEnd.Value - DateTimeOffset.UtcNow).TotalSeconds));
        }

        private int GetFailedAttemptCooldownSeconds(int failedCount)
        {
            var baseSeconds = Math.Max(1, _failedAttemptCooldownBaseSeconds);
            return Math.Max(1, failedCount * baseSeconds);
        }

        private async Task<User> EnsurePermanentLockIfThresholdReachedAsync(User user)
        {
            if (user.AccessFailedCount < _maxLoginAttempts || user.LockoutEnd == DateTimeOffset.MaxValue)
            {
                return user;
            }

            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            return await _userManager.FindByIdAsync(user.Id.ToString()) ?? user;
        }

        private BadRequestObjectResult ApiBadRequest(string message, string code, object? errors = null)
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = message,
                Code = code,
                Errors = errors
            });
        }

        private UnauthorizedObjectResult ApiUnauthorized(string message, string code)
        {
            return Unauthorized(new ApiErrorResponse
            {
                Message = message,
                Code = code
            });
        }

        private ConflictObjectResult ApiConflict(string message, string code)
        {
            return Conflict(new ApiErrorResponse
            {
                Message = message,
                Code = code
            });
        }
    }
}
