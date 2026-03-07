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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CampaignDTO>>> GetCampaigns([FromQuery] bool showArchived = false)
        {
            var query = _context.Campaigns.AsQueryable();

            if (!showArchived)
                query = query.Where(c => !c.IsArchived);

            var campaigns = await query
                .Include(c => c.Location)
                .Select(c => new CampaignDTO
                {
                    CampaignID = c.CampaignID,
                    CampaignName = c.CampaignName,
                    Description = c.Description,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
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
        public async Task<ActionResult<CampaignDTO>> GetCampaign(int id)
        {
            var campaign = await _context.Campaigns
                .Include(c => c.Location)
                .FirstOrDefaultAsync(c => c.CampaignID == id);

            if (campaign == null)
                return NotFound();

            var dto = new CampaignDTO
            {
                CampaignID = campaign.CampaignID,
                CampaignName = campaign.CampaignName,
                Description = campaign.Description,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
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

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<CampaignDTO>> CreateCampaign([FromBody] CreateCampaignDTO dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var campaign = new Campaign
            {
                CampaignName = dto.CampaignName,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Budget = dto.Budget,
                TargetGoal = dto.TargetGoal,
                Status = dto.Status,
                LocationID = dto.LocationID,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Campaigns.Add(campaign);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCampaign), new { id = campaign.CampaignID }, campaign);
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignDTO dto)
        {
            var campaign = await _context.Campaigns.FindAsync(id);

            if (campaign == null)
                return NotFound();

            campaign.CampaignName = dto.CampaignName;
            campaign.Description = dto.Description;
            campaign.StartDate = dto.StartDate;
            campaign.EndDate = dto.EndDate;
            campaign.Budget = dto.Budget;
            campaign.TargetGoal = dto.TargetGoal;
            campaign.Status = dto.Status;
            campaign.LocationID = dto.LocationID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampaign(int id)
        {
            var campaign = await _context.Campaigns.FindAsync(id);

            if (campaign == null)
                return NotFound();

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

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            campaign.IsArchived = true;
            campaign.ArchivedDate = DateTime.UtcNow;
            campaign.ArchivedBy = userId;
            await _context.SaveChangesAsync();
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
