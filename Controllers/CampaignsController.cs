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
    public class CampaignsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public CampaignsController(VoyagerDbContext context)
        {
            _context = context;
        }

        private static string ResolveCampaignStatus(string? requestedStatus, DateTime startDate, DateTime endDate)
        {
            if (string.Equals(requestedStatus, "Paused", StringComparison.OrdinalIgnoreCase))
                return "Paused";

            var today = DateTime.UtcNow.Date;
            var start = startDate.Date;
            var end = endDate.Date;

            if (today < start)
                return "Upcoming";

            if (today > end)
                return "Completed";

            return "Active";
        }

        private static string? ValidateCampaignInput(CreateCampaignDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CampaignName))
                return "Campaign name is required.";

            if (dto.Budget <= 0)
                return "Budget must be greater than 0.";

            if (dto.LocationID <= 0)
                return "Location is required.";

            if (dto.EndDate.Date < dto.StartDate.Date)
                return "End date must be on or after start date.";

            return null;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CampaignDTO>>> GetCampaigns(
            [FromQuery] bool showArchived = false,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Campaigns.AsQueryable();

            if (!showArchived)
                query = query.Where(c => !c.IsArchived);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(c => c.Status == status);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(c =>
                    c.CampaignName.Contains(term) ||
                    (c.Description != null && c.Description.Contains(term)));
            }

            var campaigns = await query
                .Include(c => c.Location)
                .Include(c => c.Archiver)
                .Select(c => new CampaignDTO
                {
                    CampaignID = c.CampaignID,
                    CampaignName = c.CampaignName,
                    Description = c.Description,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    ImageUrl = c.ImageUrl,
                    Budget = c.Budget,
                    TargetGoal = c.TargetGoal,
                    Status = c.Status,
                    CreatedDate = c.CreatedDate,
                    CreatedBy = c.CreatedBy,
                    LocationID = c.LocationID,
                    LocationName = c.Location.LocationName,
                    Latitude = c.Location.Latitude,
                    Longitude = c.Location.Longitude,
                    IsArchived = c.IsArchived,
                    ArchivedDate = c.ArchivedDate,
                    ArchivedByUserName = c.Archiver != null ? c.Archiver.FirstName + " " + c.Archiver.LastName : null
                })
                .ToListAsync();

            return Ok(campaigns);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CampaignDTO>> GetCampaign(int id, [FromQuery] bool showArchived = false)
        {
            var campaign = await _context.Campaigns
                .Include(c => c.Location)
                .Include(c => c.Archiver)
                .FirstOrDefaultAsync(c => c.CampaignID == id);

            if (campaign == null)
                return NotFound();

            if (campaign.IsArchived && !showArchived)
                return NotFound();

            var dto = new CampaignDTO
            {
                CampaignID = campaign.CampaignID,
                CampaignName = campaign.CampaignName,
                Description = campaign.Description,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
                ImageUrl = campaign.ImageUrl,
                Budget = campaign.Budget,
                TargetGoal = campaign.TargetGoal,
                Status = campaign.Status,
                CreatedDate = campaign.CreatedDate,
                CreatedBy = campaign.CreatedBy,
                LocationID = campaign.LocationID,
                LocationName = campaign.Location.LocationName,
                Latitude = campaign.Location.Latitude,
                Longitude = campaign.Location.Longitude,
                IsArchived = campaign.IsArchived,
                ArchivedDate = campaign.ArchivedDate,
                ArchivedByUserName = campaign.Archiver != null ? campaign.Archiver.FirstName + " " + campaign.Archiver.LastName : null
            };

            return Ok(dto);
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<CampaignDTO>> CreateCampaign([FromBody] CreateCampaignDTO dto)
        {
            var validationError = ValidateCampaignInput(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            if (string.Equals(dto.Status, "Paused", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Campaign can only be paused after creation." });

            var locationExists = await _context.CampaignLocations
                .AnyAsync(l => l.LocationID == dto.LocationID && !l.IsArchived);
            if (!locationExists)
                return BadRequest(new { message = "Selected location is invalid or archived." });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var campaign = new Campaign
            {
                CampaignName = dto.CampaignName.Trim(),
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                ImageUrl = dto.ImageUrl,
                Budget = dto.Budget,
                TargetGoal = dto.TargetGoal,
                Status = ResolveCampaignStatus(dto.Status, dto.StartDate, dto.EndDate),
                LocationID = dto.LocationID,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Campaigns.Add(campaign);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = $"Failed to save campaign. {detail}" });
            }

            var created = await _context.Campaigns
                .Include(c => c.Location)
                .FirstOrDefaultAsync(c => c.CampaignID == campaign.CampaignID);

            if (created == null)
                return StatusCode(500, new { message = "Campaign was created but could not be reloaded." });

            return CreatedAtAction(nameof(GetCampaign), new { id = created.CampaignID }, new CampaignDTO
            {
                CampaignID = created.CampaignID,
                CampaignName = created.CampaignName,
                Description = created.Description,
                StartDate = created.StartDate,
                EndDate = created.EndDate,
                ImageUrl = created.ImageUrl,
                Budget = created.Budget,
                TargetGoal = created.TargetGoal,
                Status = created.Status,
                CreatedDate = created.CreatedDate,
                CreatedBy = created.CreatedBy,
                LocationID = created.LocationID,
                LocationName = created.Location.LocationName,
                Latitude = created.Location.Latitude,
                Longitude = created.Location.Longitude,
                IsArchived = created.IsArchived,
                ArchivedDate = created.ArchivedDate
            });
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignDTO dto)
        {
            var validationError = ValidateCampaignInput(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var campaign = await _context.Campaigns.FindAsync(id);

            if (campaign == null)
                return NotFound();

            campaign.CampaignName = dto.CampaignName.Trim();
            campaign.Description = dto.Description;
            campaign.StartDate = dto.StartDate;
            campaign.EndDate = dto.EndDate;
            campaign.ImageUrl = dto.ImageUrl;
            campaign.Budget = dto.Budget;
            campaign.TargetGoal = dto.TargetGoal;
            campaign.Status = ResolveCampaignStatus(dto.Status, dto.StartDate, dto.EndDate);
            campaign.LocationID = dto.LocationID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampaign(int id)
        {
            var campaign = await _context.Campaigns.FindAsync(id);

            if (campaign == null)
                return NotFound();

            if (!campaign.IsArchived)
                return BadRequest(new { message = "Campaign must be archived before deletion." });

            if (!campaign.ArchivedDate.HasValue || campaign.ArchivedDate.Value > DateTime.UtcNow.AddDays(-30))
                return BadRequest(new { message = "Campaign can only be permanently deleted after 30 days in archive." });

            _context.Campaigns.Remove(campaign);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> ArchiveCampaign(int id)
        {
            var campaign = await _context.Campaigns.FindAsync(id);
            if (campaign == null) return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out var userId);
            campaign.IsArchived = true;
            campaign.ArchivedDate = DateTime.UtcNow;
            campaign.ArchivedBy = userId > 0 ? userId : null;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = $"Failed to archive campaign. {detail}" });
            }
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPatch("{id}/restore")]
        public async Task<IActionResult> RestoreCampaign(int id)
        {
            var campaign = await _context.Campaigns.FindAsync(id);
            if (campaign == null) return NotFound();

            campaign.IsArchived = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
