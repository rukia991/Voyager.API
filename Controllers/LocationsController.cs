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
    [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager,Marketing Staff")]
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly IAuditService _auditService;

        public LocationsController(VoyagerDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
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
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "CreateLocation",
                "Locations",
                $"Created location {location.LocationName} (ID: {location.LocationID})",
                GetRequestIpAddress());
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
        public async Task<IActionResult> UpdateLocation(int id, CreateLocationDTO dto)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null)
                return NotFound(new ApiErrorResponse { Message = "Location not found.", Code = "LOCATION_NOT_FOUND" });

            location.LocationName = dto.LocationName;
            location.Description = dto.Description;
            location.Latitude = dto.Latitude;
            location.Longitude = dto.Longitude;
            location.Country = dto.Country;

            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "UpdateLocation",
                "Locations",
                $"Updated location {location.LocationName} (ID: {location.LocationID})",
                GetRequestIpAddress());
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound(new ApiErrorResponse { Message = "Location not found.", Code = "LOCATION_NOT_FOUND" });
            if (await _context.Campaigns.AnyAsync(c => c.LocationID == id)) return BadRequest(new ApiErrorResponse { Message = "Location is in use by a campaign.", Code = "LOCATION_IN_USE" });
            _context.CampaignLocations.Remove(location);
            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "DeleteLocation",
                "Locations",
                $"Deleted location {location.LocationName} (ID: {location.LocationID})",
                GetRequestIpAddress());
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
                return BadRequest(new ApiErrorResponse { Message = $"Failed to archive location. {detail}", Code = "LOCATION_ARCHIVE_FAILED" });
            }
            await _auditService.LogAsync(
                userId > 0 ? userId : null,
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "ArchiveLocation",
                "Locations",
                $"Archived location {location.LocationName} (ID: {location.LocationID})",
                GetRequestIpAddress());
            return NoContent();
        }

        [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
        [HttpPatch("{id}/restore")]
        public async Task<IActionResult> RestoreLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound(new ApiErrorResponse { Message = "Location not found.", Code = "LOCATION_NOT_FOUND" });
            location.IsArchived = false;
            await _context.SaveChangesAsync();
            await _auditService.LogAsync(
                GetCurrentUserId(),
                User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                "RestoreLocation",
                "Locations",
                $"Restored location {location.LocationName} (ID: {location.LocationID})",
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
}
