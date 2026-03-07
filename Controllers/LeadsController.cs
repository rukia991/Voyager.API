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
    public class LeadsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public LeadsController(VoyagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeadDTO>>> GetLeads(
            [FromQuery] string? status,
            [FromQuery] string? source,
            [FromQuery] string? search,
            [FromQuery] bool showArchived = false)
        {
            var query = _context.Leads
                .Include(l => l.User)
                .Include(l => l.Campaign)
                .AsQueryable();

            if (!showArchived)
                query = query.Where(l => !l.IsArchived);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(l => l.LeadStatus == status);

            if (!string.IsNullOrEmpty(source))
                query = query.Where(l => l.Source == source);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(l => 
                    (l.User != null && (l.User.FirstName + " " + l.User.LastName).Contains(search)) ||
                    (l.User != null && l.User.Email != null && l.User.Email.Contains(search)) ||
                    l.Notes != null && l.Notes.Contains(search));
            }

            var leads = await query.Select(l => new LeadDTO
            {
                LeadID = l.LeadID,
                UserID = l.UserID,
                UserName = l.User != null ? l.User.FirstName + " " + l.User.LastName : "Unknown",
                CampaignID = l.CampaignID,
                CampaignName = l.Campaign.CampaignName,
                LeadStatus = l.LeadStatus,
                LeadScore = l.LeadScore,
                Source = l.Source,
                Notes = l.Notes,
                CreatedDate = l.CreatedDate,
                LastContactDate = l.LastContactDate,
                IsArchived = l.IsArchived,
                ArchivedDate = l.ArchivedDate,
                ArchivedByUserName = l.Archiver != null ? l.Archiver.FirstName + " " + l.Archiver.LastName : null
            })
            .ToListAsync();

            return Ok(leads);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeadDTO>> GetLead(int id)
        {
            var lead = await _context.Leads
                .Include(l => l.User)
                .Include(l => l.Campaign)
                .FirstOrDefaultAsync(l => l.LeadID == id);

            if (lead == null)
                return NotFound();

            return new LeadDTO
            {
                LeadID = lead.LeadID,
                UserID = lead.UserID,
                UserName = lead.User != null ? lead.User.FirstName + " " + lead.User.LastName : "Unknown",
                CampaignID = lead.CampaignID,
                CampaignName = lead.Campaign.CampaignName,
                LeadStatus = lead.LeadStatus,
                LeadScore = lead.LeadScore,
                Source = lead.Source,
                Notes = lead.Notes,
                CreatedDate = lead.CreatedDate,
                LastContactDate = lead.LastContactDate,
                IsArchived = lead.IsArchived,
                ArchivedDate = lead.ArchivedDate,
                ArchivedByUserName = lead.Archiver != null ? lead.Archiver.FirstName + " " + lead.Archiver.LastName : null
            };
        }

        [HttpPost]
        public async Task<ActionResult<LeadDTO>> CreateLead([FromBody] CreateLeadDTO dto)
        {
            var lead = new Lead
            {
                UserID = dto.UserID,
                CampaignID = dto.CampaignID,
                LeadStatus = dto.LeadStatus,
                LeadScore = dto.LeadScore,
                Source = dto.Source,
                Notes = dto.Notes,
                CreatedDate = DateTime.UtcNow
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLead), new { id = lead.LeadID }, lead);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLead(int id, [FromBody] UpdateLeadDTO dto)
        {
            var lead = await _context.Leads.FindAsync(id);

            if (lead == null)
                return NotFound();

            lead.LeadStatus = dto.LeadStatus;
            lead.LeadScore = dto.LeadScore;
            lead.Notes = dto.Notes;
            lead.Source = dto.Source;
            lead.LastContactDate = dto.LastContactDate;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLead(int id)
        {
            var lead = await _context.Leads.FindAsync(id);

            if (lead == null)
                return NotFound();

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> ArchiveLead(int id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound();

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            lead.IsArchived = true;
            lead.ArchivedDate = DateTime.UtcNow;
            lead.ArchivedBy = userId;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/restore")]
        public async Task<IActionResult> RestoreLead(int id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return NotFound();

            lead.IsArchived = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
