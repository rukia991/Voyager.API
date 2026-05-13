using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;
using Voyager.API.Services;

namespace Voyager.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class SecurityController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly UserManager<User> _userManager;

        public SecurityController(VoyagerDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<SecurityDashboardDTO>> GetDashboard()
        {
            var sinceUtc = DateTime.UtcNow.AddDays(-7);

            var suspiciousLogins = await _context.AuditLogs
                .Where(x => x.Action == "Login" && x.IsSuspicious && x.Timestamp >= sinceUtc)
                .OrderByDescending(x => x.Timestamp)
                .Take(20)
                .Select(x => new SecurityAuditItemDTO
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Email = MaskingHelper.MaskEmail(x.Email),
                    Action = x.Action,
                    Module = x.Module,
                    IpAddress = MaskingHelper.MaskIpAddress(x.IpAddress),
                    Country = x.Country,
                    City = x.City,
                    Details = x.Details,
                    Timestamp = x.Timestamp
                })
                .ToListAsync();

            var failedAttempts = await _context.AuditLogs
                .Where(x => x.Action == "Login" && !x.IsSuccess && x.Timestamp >= sinceUtc)
                .OrderByDescending(x => x.Timestamp)
                .Take(20)
                .Select(x => new SecurityAuditItemDTO
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Email = MaskingHelper.MaskEmail(x.Email),
                    Action = x.Action,
                    Module = x.Module,
                    IpAddress = MaskingHelper.MaskIpAddress(x.IpAddress),
                    Country = x.Country,
                    City = x.City,
                    Details = x.Details,
                    Timestamp = x.Timestamp
                })
                .ToListAsync();

            var successfulLogins = await _context.AuditLogs
                .Where(x => x.Action == "Login" && x.IsSuccess && !x.IsSuspicious && x.Timestamp >= sinceUtc)
                .OrderByDescending(x => x.Timestamp)
                .Take(20)
                .Select(x => new SecurityAuditItemDTO
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Email = MaskingHelper.MaskEmail(x.Email),
                    Action = x.Action,
                    Module = x.Module,
                    IpAddress = MaskingHelper.MaskIpAddress(x.IpAddress),
                    Country = x.Country,
                    City = x.City,
                    Details = x.Details,
                    Timestamp = x.Timestamp
                })
                .ToListAsync();

            var lockedUsers = await _userManager.Users
                .Where(u => u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow)
                .OrderByDescending(u => u.LockoutEnd)
                .ToListAsync();

            var lockedUserIds = lockedUsers.Select(u => u.Id).ToList();
            var latestLockedUserAttempts = await _context.AuditLogs
                .Where(x => x.Action == "Login"
                    && x.UserId != null
                    && lockedUserIds.Contains(x.UserId.Value))
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();

            var latestAttemptLookup = latestLockedUserAttempts
                .GroupBy(x => x.UserId!.Value)
                .ToDictionary(
                    group => group.Key,
                    group => group.First());

            var lockedAccounts = lockedUsers
                .Select(u =>
                {
                    latestAttemptLookup.TryGetValue(u.Id, out var latestAttempt);

                    return new LockedAccountDTO
                    {
                        UserId = u.Id,
                        UserName = u.UserName ?? string.Empty,
                        Email = MaskingHelper.MaskEmail(u.Email),
                        FailedAccessCount = u.AccessFailedCount,
                        LockoutEnd = u.LockoutEnd,
                        LastAttemptIpAddress = MaskingHelper.MaskIpAddress(latestAttempt?.IpAddress),
                        LastAttemptAt = latestAttempt?.Timestamp
                    };
                })
                .ToList();

            return Ok(new SecurityDashboardDTO
            {
                SuspiciousLoginCount = suspiciousLogins.Count,
                FailedLoginCount = failedAttempts.Count,
                LockedAccountCount = lockedAccounts.Count,
                SuspiciousLogins = suspiciousLogins,
                FailedAttempts = failedAttempts,
                RecentSuccessfulLogins = successfulLogins,
                LockedAccounts = lockedAccounts
            });
        }

        [HttpGet("audit/{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<SecurityAuditItemDTO>> GetAuditDetail(int id)
        {
            var audit = await _context.AuditLogs
                .FirstOrDefaultAsync(x => x.Id == id);

            if (audit == null)
            {
                return NotFound(new ApiErrorResponse { Message = "Security audit entry not found.", Code = "AUDIT_NOT_FOUND" });
            }

            await LogRevealAsync("RevealSecurityAudit", $"Viewed full security audit for {audit.Email}");

            return Ok(new SecurityAuditItemDTO
            {
                Id = audit.Id,
                UserId = audit.UserId,
                Email = audit.Email,
                Action = audit.Action,
                Module = audit.Module,
                IpAddress = audit.IpAddress,
                Country = audit.Country,
                City = audit.City,
                Details = audit.Details,
                Timestamp = audit.Timestamp
            });
        }

        [HttpGet("locked-account/{userId:int}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<LockedAccountDTO>> GetLockedAccountDetail(int userId)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new ApiErrorResponse { Message = "Locked account not found.", Code = "USER_NOT_FOUND" });
            }

            var latestAttempt = await _context.AuditLogs
                .Where(x => x.Action == "Login" && x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .FirstOrDefaultAsync();

            await LogRevealAsync("RevealLockedAccount", $"Viewed full locked account details for {user.Email ?? user.UserName ?? user.Id.ToString()}");

            return Ok(new LockedAccountDTO
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FailedAccessCount = user.AccessFailedCount,
                LockoutEnd = user.LockoutEnd,
                LastAttemptIpAddress = latestAttempt?.IpAddress ?? string.Empty,
                LastAttemptAt = latestAttempt?.Timestamp
            });
        }

        [HttpPost("unlock-account")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UnlockAccount([FromBody] UnlockAccountDTO dto)
        {
            if (dto.UserId == null && string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new ApiErrorResponse { Message = "Provide a userId or email.", Code = "USER_LOOKUP_REQUIRED" });
            }

            User? targetUser = null;

            if (dto.UserId != null)
            {
                targetUser = await _userManager.FindByIdAsync(dto.UserId.Value.ToString());
            }

            if (targetUser == null && !string.IsNullOrWhiteSpace(dto.Email))
            {
                targetUser = await _userManager.FindByEmailAsync(dto.Email.Trim());
            }

            if (targetUser == null)
            {
                return NotFound(new ApiErrorResponse { Message = "User not found.", Code = "USER_NOT_FOUND" });
            }

            await _userManager.SetLockoutEndDateAsync(targetUser, null);
            await _userManager.ResetAccessFailedCountAsync(targetUser);
            await _userManager.UpdateSecurityStampAsync(targetUser);

            var actorId = GetCurrentUserId();
            var actorEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? "Unknown";
            var ipAddress = GetRequestIpAddress();

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = actorId,
                Email = actorEmail,
                Action = "UnlockAccount",
                Module = "Security",
                Details = $"Unlocked account for {targetUser.Email ?? targetUser.UserName ?? targetUser.Id.ToString()}",
                IpAddress = ipAddress,
                IsSuccess = true,
                IsSuspicious = false,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Account unlocked successfully." });
        }

        private int? GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userId, out var parsedUserId) ? parsedUserId : null;
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

        private async Task LogRevealAsync(string action, string details)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = GetCurrentUserId(),
                Email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? "Unknown",
                Action = action,
                Module = "Security",
                Details = details,
                IpAddress = GetRequestIpAddress(),
                IsSuccess = true,
                IsSuspicious = false,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}
