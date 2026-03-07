using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.DTOs;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerPortalController : ControllerBase
    {
        private readonly VoyagerDbContext _context;
        private readonly UserManager<User> _userManager;

        public CustomerPortalController(VoyagerDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET available campaign offers for any authenticated user
        [HttpGet("offers")]
        public async Task<ActionResult<IEnumerable<CampaignOfferDTO>>> GetOffers()
        {
            var userId = int.Parse(_userManager.GetUserId(User)!);

            var enrolledIds = await _context.CampaignLeads
                .Where(cl => cl.Lead != null && cl.Lead.UserID == userId)
                .Select(cl => cl.CampaignID)
                .ToListAsync();

            var campaigns = await _context.Campaigns
                .Include(c => c.Location)
                .Where(c => c.Status == "Active" && !c.IsArchived)
                .Select(c => new CampaignOfferDTO
                {
                    CampaignID = c.CampaignID,
                    CampaignName = c.CampaignName,
                    Description = c.Description,
                    TargetGoal = c.TargetGoal,
                    Status = c.Status,
                    LocationName = c.Location != null ? c.Location.LocationName : null,
                    Country = c.Location != null ? c.Location.Country : null,
                    Latitude = c.Location != null ? c.Location.Latitude : null,
                    Longitude = c.Location != null ? c.Location.Longitude : null,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    IsEnrolled = enrolledIds.Contains(c.CampaignID)
                })
                .ToListAsync();

            return Ok(campaigns);
        }

        // GET profile of current user
        [HttpGet("profile")]
        public async Task<ActionResult<CustomerProfileDTO>> GetProfile()
        {
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            return Ok(new CustomerProfileDTO
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty
            });
        }

        // PATCH profile
        [HttpPatch("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] CustomerProfileDTO dto)
        {
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;
            await _userManager.UpdateAsync(user);
            return NoContent();
        }

        // POST submit feedback for a campaign
        [HttpPost("feedback")]
        public async Task<IActionResult> SubmitFeedback([FromBody] CampaignFeedbackDTO dto)
        {
            // Feedback is stored as an audit log entry for simplicity
            var userId = int.Parse(_userManager.GetUserId(User)!);
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = $"Feedback: {dto.Rating}/5 stars",
                Module = "Customer Portal",
                Details = dto.Comment ?? string.Empty,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Feedback submitted successfully." });
        }
    }
}
