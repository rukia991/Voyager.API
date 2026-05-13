using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;
using Voyager.API.Services;

namespace Voyager.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager,Marketing Staff")]
    [ApiController]
    [Route("api/[controller]")]
    public class EmailTemplatesController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly IAuditService _auditService;

        public EmailTemplatesController(VoyagerDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmailTemplateDTO>>> GetTemplates()
        {
            var templates = await _context.EmailTemplates
                .Include(t => t.Creator)
                .Select(t => new EmailTemplateDTO
                {
                    TemplateID = t.TemplateID,
                    TemplateName = t.TemplateName,
                    Subject = t.Subject,
                    Body = t.Body,
                    IsApproved = t.IsApproved,
                    CreatedBy = t.CreatedBy,
                    CreatorName = t.Creator.FirstName + " " + t.Creator.LastName,
                    CreatedDate = t.CreatedDate
                })
                .ToListAsync();

            return Ok(templates);
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<EmailTemplateDTO>> CreateTemplate([FromBody] CreateEmailTemplateDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var tenantId = await _context.Tenants
                .OrderBy(t => t.TenantId)
                .Select(t => t.TenantId)
                .FirstOrDefaultAsync();

            if (tenantId == 0)
                return StatusCode(500, new ApiErrorResponse { Message = "No tenant is configured for email template creation.", Code = "TENANT_NOT_CONFIGURED" });

            var template = new EmailTemplate
            {
                TenantId = tenantId,
                TemplateName = dto.TemplateName,
                Subject = dto.Subject,
                Body = dto.Body,
                IsApproved = "Approved", // Managers or Admins are auto-approved
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };

            _context.EmailTemplates.Add(template);
            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                userId,
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "CreateEmailTemplate",
                "EmailTemplates",
                $"Created email template {template.TemplateName} (ID: {template.TemplateID})",
                GetRequestIpAddress());

            return CreatedAtAction(nameof(GetTemplates), new { id = template.TemplateID }, template);
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateEmailTemplateDTO dto)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound(new ApiErrorResponse { Message = "Template not found.", Code = "TEMPLATE_NOT_FOUND" });

            template.TemplateName = dto.TemplateName;
            template.Subject = dto.Subject;
            template.Body = dto.Body;

            // Editing a previously approved template requires re-approval.
            if (template.IsApproved == "Approved")
                template.IsApproved = "Pending";

            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "UpdateEmailTemplate",
                "EmailTemplates",
                $"Updated email template {template.TemplateName} (ID: {template.TemplateID})",
                GetRequestIpAddress());
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound(new ApiErrorResponse { Message = "Template not found.", Code = "TEMPLATE_NOT_FOUND" });

            var isUsed = await _context.EmailLogs.AnyAsync(l => l.TemplateID == id);
            if (isUsed)
                return BadRequest(new ApiErrorResponse { Message = "Template cannot be deleted because it has related email logs.", Code = "TEMPLATE_IN_USE" });

            _context.EmailTemplates.Remove(template);
            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "DeleteEmailTemplate",
                "EmailTemplates",
                $"Deleted email template {template.TemplateName} (ID: {template.TemplateID})",
                GetRequestIpAddress());
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> ApproveTemplate(int id, [FromBody] UpdateTemplateStatusDTO dto)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound(new ApiErrorResponse { Message = "Template not found.", Code = "TEMPLATE_NOT_FOUND" });

            template.IsApproved = dto.Status; // "Approved" or "Rejected"
            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "ApproveEmailTemplate",
                "EmailTemplates",
                $"Set email template {template.TemplateName} (ID: {template.TemplateID}) status to {dto.Status}",
                GetRequestIpAddress());
            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private string GetRequestIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
            {
                return forwardedFor.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                    ?? HttpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "Unknown";
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }
    }

    public class UpdateTemplateStatusDTO
    {
        [Required]
        [RegularExpression("^(Approved|Rejected|Pending)$", ErrorMessage = "Status must be Approved, Rejected, or Pending.")]
        public string Status { get; set; } = string.Empty;
    }
}
