using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkflowRulesController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly IConfiguration _config;

        public WorkflowRulesController(VoyagerDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkflowRuleDTO>>> GetRules()
        {
            return await _context.WorkflowRules
                .Select(r => new WorkflowRuleDTO
                {
                    RuleID = r.RuleID,
                    RuleName = r.RuleName,
                    TriggerEvent = r.TriggerEvent,
                    Condition = r.Condition,
                    Action = r.Action,
                    IsActive = r.IsActive,
                    CreatedDate = r.CreatedDate
                })
                .ToListAsync();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<WorkflowRuleDTO>> CreateRule([FromBody] CreateWorkflowRuleDTO dto)
        {
            var rule = new WorkflowRule
            {
                RuleName = dto.RuleName,
                TriggerEvent = dto.TriggerEvent,
                Condition = dto.Condition,
                Action = dto.Action,
                IsActive = dto.IsActive,
                CreatedDate = DateTime.UtcNow
            };

            _context.WorkflowRules.Add(rule);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRules), new { id = rule.RuleID }, rule);
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleRule(int id)
        {
            var rule = await _context.WorkflowRules.FindAsync(id);
            if (rule == null) return NotFound();

            rule.IsActive = !rule.IsActive;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRule(int id)
        {
            var rule = await _context.WorkflowRules.FindAsync(id);
            if (rule == null) return NotFound();

            _context.WorkflowRules.Remove(rule);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize]
        [HttpGet("settings")]
        public ActionResult<SystemSettingsDTO> GetSystemSettings()
        {
            // Resolve Mapbox token from common configuration keys (appsettings, user-secrets, env vars).
            string? mapboxToken = _config["Mapbox:AccessToken"];
            if (string.IsNullOrWhiteSpace(mapboxToken))
            {
                mapboxToken = _config["MapboxToken"];
            }
            if (string.IsNullOrWhiteSpace(mapboxToken))
            {
                mapboxToken = _config["MAPBOX_ACCESS_TOKEN"];
            }

            return Ok(new SystemSettingsDTO
            {
                MapboxAccessToken = mapboxToken?.Trim() ?? string.Empty,
                EmailSmtpHost = _config["Email:SmtpHost"] ?? "smtp.example.com",
                EmailSmtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587"),
                EmailSender = _config["Email:Sender"] ?? "noreply@voyager.com"
            });
        }
    }
}
