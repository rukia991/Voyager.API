using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Voyager.API.Data;
using Voyager.API.DTOs;

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
            var backupData = new
            {
                Timestamp = DateTime.UtcNow,
                Users = await _context.Users.ToListAsync(),
                Campaigns = await _context.Campaigns.ToListAsync(),
                Leads = await _context.Leads.ToListAsync(),
                Locations = await _context.CampaignLocations.ToListAsync()
            };

            var options = new JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
                WriteIndented = true
            };

            var jsonString = JsonSerializer.Serialize(backupData, options);
            var bytes = System.Text.Encoding.UTF8.GetBytes(jsonString);

            var fileName = $"Voyager_Backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

            if (bytes.Length == 0)
            {
                return StatusCode(500, new ApiErrorResponse
                {
                    Message = "Backup generation failed.",
                    Code = "BACKUP_GENERATION_FAILED"
                });
            }

            return File(bytes, "application/json", fileName);
        }
    }
}
