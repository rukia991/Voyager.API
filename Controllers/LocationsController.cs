using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
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
        public async Task<ActionResult<IEnumerable<CampaignLocation>>> GetLocations([FromQuery] bool showArchived = false)
        {
            var query = _context.CampaignLocations.AsQueryable();
            if (!showArchived)
                query = query.Where(l => !l.IsArchived);
            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CampaignLocation>> GetLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound();
            return location;
        }

        [HttpPost]
        public async Task<ActionResult<CampaignLocation>> CreateLocation(CampaignLocation location)
        {
            _context.CampaignLocations.Add(location);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLocation), new { id = location.LocationID }, location);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, CampaignLocation location)
        {
            if (id != location.LocationID) return BadRequest();
            _context.Entry(location).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.CampaignLocations.Any(e => e.LocationID == id)) return NotFound(); else throw; }
            return NoContent();
        }

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

        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> ArchiveLocation(int id)
        {
            var location = await _context.CampaignLocations.FindAsync(id);
            if (location == null) return NotFound();
            location.IsArchived = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

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
