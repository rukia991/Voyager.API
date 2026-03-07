using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;
using Voyager.API.Services;

namespace Voyager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmailLogsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly IEmailService _emailService;

        public EmailLogsController(VoyagerDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmailLogDTO>>> GetLogs()
        {
            var logs = await _context.EmailLogs
                .Include(l => l.Campaign)
                .Include(l => l.Lead)
                .ThenInclude(le => le.User)
                .Include(l => l.Template)
                .Include(l => l.SentByUser)
                .Select(l => new EmailLogDTO
                {
                    EmailLogID = l.EmailLogID,
                    CampaignName = l.Campaign.CampaignName,
                    LeadName = l.Lead.FullName ?? (l.Lead.User != null ? l.Lead.User.FirstName + " " + l.Lead.User.LastName : "Unknown"),
                    TemplateName = l.Template.TemplateName,
                    SentByName = l.SentByUser.FirstName + " " + l.SentByUser.LastName,
                    SentDate = l.SentDate,
                    Status = l.Status
                })
                .OrderByDescending(l => l.SentDate)
                .ToListAsync();

            return Ok(logs);
        }

        [HttpPost("bulk-send")]
        public async Task<IActionResult> BulkSend([FromBody] BulkSendDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Load template, campaign, and leads in one go
            var template = await _context.EmailTemplates.FindAsync(dto.TemplateID);
            if (template == null) return NotFound("Template not found.");
            if (template.IsApproved != "Approved") return BadRequest("Template is not approved for sending.");

            var campaign = await _context.Campaigns.FindAsync(dto.CampaignID);
            if (campaign == null) return NotFound("Campaign not found.");

            var leads = await _context.Leads
                .Include(l => l.User)
                .Where(l => dto.LeadIDs.Contains(l.LeadID))
                .ToListAsync();

            int sent = 0, failed = 0, skipped = 0;

            foreach (var lead in leads)
            {
                // Resolve email address: direct Email field first, then linked User
                var recipientEmail = lead.Email ?? lead.User?.Email;
                var recipientName = lead.FullName
                    ?? (lead.User != null ? lead.User.FirstName + " " + lead.User.LastName : "Valued Customer");

                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    skipped++;
                    continue; // No email address — skip
                }

                // Personalize template body
                var personalizedBody = template.Body
                    .Replace("{{firstName}}", lead.User?.FirstName ?? recipientName.Split(' ')[0])
                    .Replace("{{lastName}}", lead.User?.LastName ?? "")
                    .Replace("{{fullName}}", recipientName)
                    .Replace("{{campaignName}}", campaign.CampaignName)
                    .Replace("{{email}}", recipientEmail);

                var personalizedSubject = template.Subject
                    .Replace("{{campaignName}}", campaign.CampaignName)
                    .Replace("{{fullName}}", recipientName);

                string status;
                try
                {
                    await _emailService.SendAsync(recipientEmail, recipientName, personalizedSubject, personalizedBody);
                    status = "Sent";
                    sent++;
                }
                catch (Exception ex)
                {
                    status = "Failed";
                    failed++;
                    Console.Error.WriteLine($"Failed to send email to {recipientEmail}: {ex.Message}");
                }

                var log = new EmailLog
                {
                    CampaignID = dto.CampaignID,
                    TemplateID = dto.TemplateID,
                    LeadID = lead.LeadID,
                    SentBy = userId,
                    SentDate = DateTime.UtcNow,
                    Status = status,
                    EmailStatus = status
                };
                _context.EmailLogs.Add(log);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Bulk send complete.",
                sent,
                failed,
                skipped
            });
        }
    }
}
