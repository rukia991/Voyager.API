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
    public class LocationsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public LocationsController(VoyagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LocationDTO>>> GetLocations([FromQuery] bool showArchived = false)
        {
            var query = _context.CampaignLocations.AsQueryable();
            if (!showArchived)
                query = query.Where(l => !l.IsArchived);
            
            return await query
                .Select(l => new LocationDTO
                {
                    LocationID = l.LocationID,
                    LocationName = l.LocationName,
                    Description = l.Description,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    Country = l.Country,
                    IsArchived = l.IsArchived,
                    ArchivedDate = l.ArchivedDate,
                    ArchivedByUserName = l.Archiver != null ? l.Archiver.FirstName + " " + l.Archiver.LastName : null,
                    CreatedDate = l.CreatedDate
                })
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LocationDTO>> GetLocation(int id)
        {
            var l = await _context.CampaignLocations
                .Include(x => x.Archiver)
                .FirstOrDefaultAsync(x => x.LocationID == id);
                
            if (l == null) return NotFound();
            
            return new LocationDTO
            {
                LocationID = l.LocationID,
                LocationName = l.LocationName,
                Description = l.Description,
                Latitude = l.Latitude,
                Longitude = l.Longitude,
                Country = l.Country,
                IsArchived = l.IsArchived,
                ArchivedDate = l.ArchivedDate,
                ArchivedByUserName = l.Archiver != null ? l.Archiver.FirstName + " " + l.Archiver.LastName : null,
                CreatedDate = l.CreatedDate
            };
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPost]
        public async Task<ActionResult<LocationDTO>> CreateLocation(CreateLocationDTO dto)
        {
            var location = new CampaignLocation
            {
                LocationName = dto.LocationName,
                Description = dto.Description,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Country = dto.Country,
                CreatedDate = DateTime.UtcNow
            };
            
            _context.CampaignLocations.Add(location);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLocation), new { id = location.LocationID }, new LocationDTO
            {
                LocationID = location.LocationID,
                LocationName = location.LocationName,
                Description = location.Description,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                Country = location.Country,
                CreatedDate = location.CreatedDate
            });
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, CampaignLocation location)
        {
            if (id != location.LocationID) return BadRequest();
            _context.Entry(location).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.CampaignLocations.Any(e => e.LocationID == id)) return NotFound(); else throw; }
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound();
            if (await _context.Campaigns.AnyAsync(c => c.LocationID == id)) return BadRequest("Location is in use by a campaign.");
            _context.CampaignLocations.Remove(location);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> ArchiveLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound();
            
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out var userId);
            location.IsArchived = true;
            location.ArchivedDate = DateTime.UtcNow;
            location.ArchivedBy = userId > 0 ? userId : null;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = $"Failed to archive location. {detail}" });
            }
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPatch("{id}/restore")]
        public async Task<IActionResult> RestoreLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound();
            location.IsArchived = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
