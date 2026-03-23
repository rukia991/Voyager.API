using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Voyager.API.DTOs;

namespace Voyager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public SettingsController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet]
        public ActionResult<SystemSettingsDTO> GetSystemSettings()
        {
            // Resolve Mapbox token from common configuration keys (appsettings, user-secrets, env vars).
            string? mapboxToken = _config["Mapbox:AccessToken"];
            if (string.IsNullOrWhiteSpace(mapboxToken)) mapboxToken = _config["MapboxToken"];
            if (string.IsNullOrWhiteSpace(mapboxToken)) mapboxToken = _config["MAPBOX_ACCESS_TOKEN"];

            return Ok(new SystemSettingsDTO
            {
                MapboxAccessToken = mapboxToken?.Trim() ?? string.Empty,
                EmailSmtpHost = _config["Email:SmtpHost"] ?? "smtp.example.com",
                EmailSmtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587"),
                EmailSender = _config["Email:Sender"] ?? "noreply@voyager.com"
            });
        }

        [HttpPost("my-plan")]
        public async Task<IActionResult> UpdateMyPlan([FromBody] MyPlanDTO dto, [FromServices] Voyager.API.Data.VoyagerDbContext context)
        {
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantIdClaim) || !int.TryParse(tenantIdClaim, out int tenantId))
                return Unauthorized();

            var tenant = await context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound("Tenant not found.");

            tenant.SubscriptionPlan = dto.Plan;
            await context.SaveChangesAsync();

            return Ok(new { message = $"Plan successfully updated to {dto.Plan}" });
        }
    }

    public class MyPlanDTO
    {
        public string Plan { get; set; } = "Basic";
    }
}
