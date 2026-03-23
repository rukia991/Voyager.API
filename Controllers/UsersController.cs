using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly VoyagerDbContext _context;

        // Roles that only SuperAdmin may manage or assign
        private static readonly string[] ProtectedRoles = { "SuperAdmin", "Admin" };

        public UsersController(UserManager<User> userManager, VoyagerDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET /api/users
        // SuperAdmin sees everyone; Admin only sees non-admin accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetUsers()
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            int? tenantId = string.IsNullOrEmpty(tenantIdClaim) || tenantIdClaim == "0" ? null : int.Parse(tenantIdClaim);

            var usersQuery = _userManager.Users.IgnoreQueryFilters();

            if (!isSuperAdmin && tenantId.HasValue)
            {
                usersQuery = usersQuery.Where(u => u.TenantId == tenantId.Value);
            }

            var users = await usersQuery.ToListAsync();

            var visible = isSuperAdmin
                ? users
                : users.Where(u => !ProtectedRoles.Contains(u.Role));

            var dtos = visible.Select(u => new UserDTO
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                AccountStatus = u.AccountStatus,
                CreatedDate = u.CreatedDate
            });

            return Ok(dtos);
        }

        // POST /api/users
        // Admin may only create Marketing Manager, Marketing Staff, Customer
        // SuperAdmin may also create Admin
        [HttpPost]
        public async Task<ActionResult<UserDTO>> CreateUser([FromBody] CreateUserDTO dto)
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");

            // Guard: Admin cannot create protected roles
            if (!isSuperAdmin && ProtectedRoles.Contains(dto.Role))
                return Forbid();

            // Guard: Enforce Subscription Plan Team Member Limits (Excluding Customers)
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            int currentTenantId = 0;
            if (!isSuperAdmin && !string.IsNullOrEmpty(tenantIdClaim) && int.TryParse(tenantIdClaim, out currentTenantId))
            {
                if (dto.Role != "Customer")
                {
                    var tenant = await _context.Tenants.FindAsync(currentTenantId);
                    if (tenant != null)
                    {
                        var plan = (tenant.SubscriptionPlan ?? "Basic").Trim();
                        int maxUsers = 1;

                        if (plan.Equals("Enterprise", StringComparison.OrdinalIgnoreCase)) maxUsers = int.MaxValue;
                        else if (plan.Equals("Pro", StringComparison.OrdinalIgnoreCase)) maxUsers = 5;
                        else if (plan.Equals("Basic", StringComparison.OrdinalIgnoreCase)) maxUsers = 1;

                        int currentTeamCount = await _context.Users.CountAsync(u => u.TenantId == currentTenantId && u.Role != "Customer");
                        if (currentTeamCount >= maxUsers)
                        {
                            return BadRequest(new { message = $"Your {plan} plan is limited to {maxUsers} team member(s). Please upgrade your subscription to add more staff." });
                        }
                    }
                }
            }

            var user = new User
            {
                TenantId = !isSuperAdmin ? currentTenantId : 0, // Explicitly set tenant for Admins
                UserName = dto.UserName,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = dto.Role,
                AccountStatus = "Active",
                CreatedDate = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, dto.Role);
            await LogAuditAsync(user.Id, "User Created", "User Management", $"Created user {user.UserName} with role {dto.Role}");

            return Ok(new UserDTO
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                AccountStatus = user.AccountStatus,
                CreatedDate = user.CreatedDate
            });
        }

        // PATCH /api/users/{id}/role
        // Admin cannot assign protected roles or modify protected accounts
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleDTO dto)
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var target = await _userManager.FindByIdAsync(id.ToString());
            if (target == null) return NotFound();

            // Guard: Admin cannot touch Admin/SuperAdmin accounts
            if (!isSuperAdmin && ProtectedRoles.Contains(target.Role))
                return Forbid();

            // Guard: Admin cannot assign protected roles
            if (!isSuperAdmin && ProtectedRoles.Contains(dto.Role))
                return Forbid();

            var currentRoles = await _userManager.GetRolesAsync(target);
            await _userManager.RemoveFromRolesAsync(target, currentRoles);
            await _userManager.AddToRoleAsync(target, dto.Role);

            target.Role = dto.Role;
            await _userManager.UpdateAsync(target);
            await LogAuditAsync(target.Id, "Role Updated", "User Management", $"Role changed to {dto.Role}");

            return NoContent();
        }

        // PATCH /api/users/{id}/status
        // Admin cannot suspend Admin/SuperAdmin accounts
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusDTO dto)
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var target = await _userManager.FindByIdAsync(id.ToString());
            if (target == null) return NotFound();

            // Guard: Admin cannot modify Admin/SuperAdmin status
            if (!isSuperAdmin && ProtectedRoles.Contains(target.Role))
                return Forbid();

            target.AccountStatus = dto.Status;
            await _userManager.UpdateAsync(target);
            await LogAuditAsync(target.Id, $"Status Changed to {dto.Status}", "User Management", $"Status updated for {target.UserName}");

            return NoContent();
        }

        // DELETE — SuperAdmin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var target = await _userManager.FindByIdAsync(id.ToString());
            if (target == null) return NotFound();

            // Guard: Cannot delete SuperAdmin accounts
            if (target.Role == "SuperAdmin")
                return Forbid();

            await _userManager.DeleteAsync(target);
            return NoContent();
        }

        // GET /api/users/audit-logs — SuperAdmin only
        [HttpGet("audit-logs")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<ActionResult<IEnumerable<AuditLogDTO>>> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .Include(l => l.User)
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .Select(l => new AuditLogDTO
                {
                    Id = l.Id,
                    UserName = l.User.UserName ?? string.Empty,
                    Action = l.Action,
                    Module = l.Module,
                    Timestamp = l.Timestamp,
                    Details = l.Details
                })
                .ToListAsync();

            return Ok(logs);
        }

        private async Task LogAuditAsync(int userId, string action, string module, string details)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                Module = module,
                Details = details,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
}
