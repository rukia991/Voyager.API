using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmailTemplatesController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public EmailTemplatesController(VoyagerDbContext context)
        {
            _context = context;
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

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<EmailTemplateDTO>> CreateTemplate([FromBody] CreateEmailTemplateDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var template = new EmailTemplate
            {
                TemplateName = dto.TemplateName,
                Subject = dto.Subject,
                Body = dto.Body,
                IsApproved = "Approved", // Managers or Admins are auto-approved
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };

            _context.EmailTemplates.Add(template);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTemplates), new { id = template.TemplateID }, template);
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateEmailTemplateDTO dto)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound();

            template.TemplateName = dto.TemplateName;
            template.Subject = dto.Subject;
            template.Body = dto.Body;

            // Editing a previously approved template requires re-approval.
            if (template.IsApproved == "Approved")
                template.IsApproved = "Pending";

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound();

            var isUsed = await _context.EmailLogs.AnyAsync(l => l.TemplateID == id);
            if (isUsed)
                return BadRequest("Template cannot be deleted because it has related email logs.");

            _context.EmailTemplates.Remove(template);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> ApproveTemplate(int id, [FromBody] UpdateTemplateStatusDTO dto)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound();

            template.IsApproved = dto.Status; // "Approved" or "Rejected"
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class UpdateTemplateStatusDTO
    {
        public string Status { get; set; } = string.Empty;
    }
}
