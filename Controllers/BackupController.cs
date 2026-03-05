using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Voyager.API.Data;

namespace Voyager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")] // Restrict to SuperAdmin only
    public class BackupController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public BackupController(VoyagerDbContext context)
        {
            _context = context;
        }

        [HttpGet("download")]
        public async Task<IActionResult> DownloadBackup()
        {
            try
            {
                var backupData = new
                {
                    Timestamp = DateTime.UtcNow,
                    Users = await _context.Users.ToListAsync(),
                    Campaigns = await _context.Campaigns.ToListAsync(),
                    Leads = await _context.Leads.ToListAsync(),
                    Locations = await _context.CampaignLocations.ToListAsync()
                };

                // Remove sensitive references if necessary (like cyclical dependencies)
                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
                    WriteIndented = true
                };

                var jsonString = JsonSerializer.Serialize(backupData, options);
                var bytes = System.Text.Encoding.UTF8.GetBytes(jsonString);

                var fileName = $"Voyager_Backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

                return File(bytes, "application/json", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
