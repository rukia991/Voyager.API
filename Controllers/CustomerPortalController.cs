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
                    ImageUrl = c.ImageUrl,
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
                UserName = user.UserName ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty
            });
        }

        [HttpPost("campaigns/{campaignId:int}/enroll")]
        public async Task<IActionResult> EnrollCampaign(int campaignId)
        {
            var userIdStr = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            
            var userId = int.Parse(userIdStr);
            var currentUser = await _userManager.FindByIdAsync(userIdStr);

            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.CampaignID == campaignId && !c.IsArchived && c.Status == "Active");
            if (campaign == null) return NotFound(new { message = "Campaign not found." });

            var lead = await _context.Leads
                .FirstOrDefaultAsync(l => l.UserID == userId || (currentUser != null && l.Email == currentUser.Email));

            if (lead == null)
            {
                lead = new Lead
                {
                    UserID = userId,
                    Email = currentUser?.Email,
                    FullName = currentUser != null ? $"{currentUser.FirstName} {currentUser.LastName}".Trim() : null,
                    LeadStatus = "New",
                    LeadScore = 0,
                    Source = "Portal Enrollment",
                    Notes = "Customer enrolled via portal.",
                    CreatedDate = DateTime.UtcNow
                };
                _context.Leads.Add(lead);
                await _context.SaveChangesAsync();
            }
            else if (lead.UserID == null && userId != 0)
            {
                // Link existing guest lead to this user account
                lead.UserID = userId;
                await _context.SaveChangesAsync();
            }

            var alreadyEnrolled = await _context.CampaignLeads
                .AnyAsync(cl => cl.CampaignID == campaignId && cl.LeadID == lead.LeadID);

            if (alreadyEnrolled)
                return Ok(new { message = "Campaign already availed." });

            var newStart = campaign.StartDate;
            var newEnd = campaign.EndDate;

            var hasOverlappingCampaign = await _context.CampaignLeads
                .Where(cl => cl.Lead.UserID == userId && !cl.Campaign.IsArchived && cl.CampaignID != campaignId)
                .AnyAsync(cl => newStart <= cl.Campaign.EndDate && newEnd >= cl.Campaign.StartDate);

            if (hasOverlappingCampaign)
                return BadRequest(new { message = "You already availed another campaign with overlapping travel dates. Please choose different dates." });

            if (!alreadyEnrolled)
            {
                _context.CampaignLeads.Add(new CampaignLead
                {
                    CampaignID = campaignId,
                    LeadID = lead.LeadID,
                    AssignedDate = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Campaign enrolled successfully." });
        }

        // PATCH profile
        [HttpPatch("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] CustomerProfileDTO dto)
        {
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.UserName))
                return BadRequest(new { message = "Username is required." });

            var trimmedUserName = dto.UserName.Trim();
            var sameUserName = string.Equals(user.UserName, trimmedUserName, StringComparison.OrdinalIgnoreCase);
            if (!sameUserName)
            {
                var exists = await _userManager.Users.AnyAsync(u => u.UserName == trimmedUserName && u.Id != user.Id);
                if (exists)
                    return BadRequest(new { message = "Username is already in use." });
            }

            user.UserName = trimmedUserName;
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
            var userId = int.Parse(_userManager.GetUserId(User)!);
            var isEnrolled = await _context.CampaignLeads
                .AnyAsync(cl => cl.CampaignID == dto.CampaignID && cl.Lead.UserID == userId);

            if (!isEnrolled)
                return BadRequest(new { message = "You must enroll in this campaign before sending feedback." });

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
