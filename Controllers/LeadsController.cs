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
                .ThenInclude(c => c.Location)
                .AsQueryable();

            // Filter out administrative roles from Lead Management
            string[] adminRoles = { "SuperAdmin", "Admin", "Marketing Manager", "Marketing Staff" };
            query = query.Where(l => l.User == null || !adminRoles.Contains(l.User.Role));

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

            var leadsRaw = await query
                .Include(l => l.CampaignLeads)
                .ThenInclude(cl => cl.Campaign)
                .ToListAsync();

            // Group by Email to handle duplicates and consolidate history
            var leads = leadsRaw
                .GroupBy(l => l.Email?.ToLower() ?? $"id-{l.LeadID}")
                .Select(g => {
                    var primaryLead = g.OrderByDescending(l => l.UserID != null).ThenBy(l => l.LeadID).First();
                    
                    // Aggregate ALL history from ALL lead records with this email
                    var consolidatedHistory = g.SelectMany(l => l.CampaignLeads)
                        .Select(cl => new LeadEnrollmentDTO
                        {
                            CampaignID = cl.CampaignID,
                            CampaignName = cl.Campaign?.CampaignName ?? "Unknown",
                            EnrolledDate = cl.AssignedDate,
                            Status = cl.Campaign?.Status ?? "Unknown"
                        })
                        .OrderByDescending(h => h.EnrolledDate)
                        .ToList();

                    // If a lead has a legacy CampaignID but no CampaignLeads, add it to history
                    foreach (var l in g) {
                        if (l.CampaignID != 0 && !consolidatedHistory.Any(h => h.CampaignID == l.CampaignID)) {
                             consolidatedHistory.Add(new LeadEnrollmentDTO {
                                 CampaignID = l.CampaignID,
                                 CampaignName = l.Campaign?.CampaignName ?? "Initial Campaign",
                                 EnrolledDate = l.CreatedDate,
                                 Status = l.Campaign?.Status ?? "Active"
                             });
                        }
                    }

                    return new LeadDTO
                    {
                        LeadID = primaryLead.LeadID,
                        UserID = primaryLead.UserID,
                        UserName = primaryLead.User != null ? primaryLead.User.FirstName + " " + primaryLead.User.LastName : "Customer",
                        CampaignID = primaryLead.CampaignID,
                        CampaignName = primaryLead.Campaign?.CampaignName ?? "N/A",
                        Email = primaryLead.Email,
                        FullName = primaryLead.FullName,
                        LeadStatus = primaryLead.LeadStatus,
                        LeadScore = primaryLead.LeadScore,
                        Source = primaryLead.Source,
                        Notes = primaryLead.Notes,
                        Latitude = primaryLead.Campaign?.Location?.Latitude,
                        Longitude = primaryLead.Campaign?.Location?.Longitude,
                        CreatedDate = primaryLead.CreatedDate,
                        LastContactDate = primaryLead.LastContactDate,
                        IsArchived = primaryLead.IsArchived,
                        ArchivedDate = primaryLead.ArchivedDate,
                        ArchivedByUserName = primaryLead.Archiver != null ? primaryLead.Archiver.FirstName + " " + primaryLead.Archiver.LastName : null,
                        EnrollmentHistory = consolidatedHistory.GroupBy(h => h.CampaignID).Select(h => h.First()).ToList()
                    };
                })
                .ToList();

            return Ok(leads);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeadDTO>> GetLead(int id)
        {
            var lead = await _context.Leads
                .Include(l => l.User)
                .Include(l => l.Campaign)
                .ThenInclude(c => c.Location)
                .Include(l => l.CampaignLeads)
                .ThenInclude(cl => cl.Campaign)
                .FirstOrDefaultAsync(l => l.LeadID == id);

            if (lead == null) return NotFound();

            // Fetch all duplicates to aggregate history
            var allEnrollments = await _context.CampaignLeads
                .Include(cl => cl.Campaign)
                .Where(cl => cl.Lead.Email == lead.Email)
                .Select(cl => new LeadEnrollmentDTO
                {
                    CampaignID = cl.CampaignID,
                    CampaignName = cl.Campaign.CampaignName,
                    EnrolledDate = cl.AssignedDate,
                    Status = cl.Campaign.Status
                })
                .ToListAsync();

            var dto = new LeadDTO
            {
                LeadID = lead.LeadID,
                UserID = lead.UserID,
                UserName = lead.User != null ? lead.User.FirstName + " " + lead.User.LastName : "Customer",
                CampaignID = lead.CampaignID,
                CampaignName = lead.Campaign?.CampaignName ?? "N/A",
                Email = lead.Email,
                FullName = lead.FullName,
                LeadStatus = lead.LeadStatus,
                LeadScore = lead.LeadScore,
                Source = lead.Source,
                Notes = lead.Notes,
                Latitude = lead.Campaign?.Location?.Latitude,
                Longitude = lead.Campaign?.Location?.Longitude,
                CreatedDate = lead.CreatedDate,
                LastContactDate = lead.LastContactDate,
                IsArchived = lead.IsArchived,
                ArchivedDate = lead.ArchivedDate,
                ArchivedByUserName = lead.Archiver != null ? lead.Archiver.FirstName + " " + lead.Archiver.LastName : null,
                EnrollmentHistory = allEnrollments.GroupBy(h => h.CampaignID).Select(g => g.First()).OrderByDescending(h => h.EnrolledDate).ToList()
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<LeadDTO>> CreateLead([FromBody] CreateLeadDTO dto)
        {
            var existingLead = await _context.Leads
                .FirstOrDefaultAsync(l => !string.IsNullOrEmpty(l.Email) && l.Email == dto.Email);

            if (existingLead != null)
            {
                // Reuse existing lead
                return CreatedAtAction(nameof(GetLead), new { id = existingLead.LeadID }, existingLead);
            }

            var lead = new Lead
            {
                UserID = dto.UserID,
                Email = dto.Email,
                FullName = dto.FullName,
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

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLead(int id)
        {
            var lead = await _context.Leads.FindAsync(id);

            if (lead == null)
                return NotFound();

            if (!lead.IsArchived)
                return BadRequest(new { message = "Lead must be archived before deletion." });

            if (!lead.ArchivedDate.HasValue || lead.ArchivedDate.Value > DateTime.UtcNow.AddDays(-30))
                return BadRequest(new { message = "Lead can only be permanently deleted after 30 days in archive." });

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
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

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
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
