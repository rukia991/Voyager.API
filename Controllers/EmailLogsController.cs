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
    public class EmailLogsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public EmailLogsController(VoyagerDbContext context)
        {
            _context = context;
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
                    LeadName = l.Lead.User != null ? l.Lead.User.FirstName + " " + l.Lead.User.LastName : "Unknown",
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
            
            // In a real app, this would trigger an async background job
            foreach (var leadId in dto.LeadIDs)
            {
                var log = new EmailLog
                {
                    CampaignID = dto.CampaignID,
                    TemplateID = dto.TemplateID,
                    LeadID = leadId,
                    SentBy = userId,
                    SentDate = DateTime.UtcNow,
                    Status = "Sent",
                    EmailStatus = "Sent"
                };
                _context.EmailLogs.Add(log);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Successfully sent {dto.LeadIDs.Count} emails." });
        }
    }
}
