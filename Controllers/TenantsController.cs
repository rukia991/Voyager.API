using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class TenantsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public TenantsController(VoyagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTenants()
        {
            var tenants = await _context.Tenants
                .OrderByDescending(t => t.CreatedDate)
                .Select(t => new {
                    t.TenantId,
                    t.CompanyName,
                    t.SubscriptionPlan,
                    t.IsActive,
                    t.CreatedDate
                })
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<IActionResult> ToggleTenantStatus(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            tenant.IsActive = !tenant.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Tenant effectively changed to {(tenant.IsActive ? "Active" : "Inactive")}", tenant });
        }
        [HttpPost("{id}/plan")]
        public async Task<IActionResult> UpdateTenantPlan(int id, [FromBody] UpdatePlanDTO dto)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            tenant.SubscriptionPlan = dto.Plan;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Tenant plan updated to {dto.Plan}", tenant });
        }
    }

    public class UpdatePlanDTO
    {
        public string Plan { get; set; } = "Basic";
    }
}
