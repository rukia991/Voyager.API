using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.DTOs;

namespace Voyager.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,Admin,Marketing Manager")]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly VoyagerDbContext _context;

        public AnalyticsController(VoyagerDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<AnalyticsSummaryDTO>> GetSummary()
        {
            var totalLeads = await _context.Leads.CountAsync();
            var emailsSent = await _context.EmailLogs.CountAsync();
            var conversions = await _context.Leads.CountAsync(l => l.LeadStatus == "Converted");
            
            // Calculate Performance Over Time (Last 7 Days)
            var performance = new List<DailyMetricDTO>();
            var startDate = DateTime.UtcNow.Date.AddDays(-6);

            var dailyLeads = await _context.Leads
                .Where(l => l.CreatedDate >= startDate)
                .GroupBy(l => l.CreatedDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dailyEmails = await _context.EmailLogs
                .Where(e => e.SentDate >= startDate)
                .GroupBy(e => e.SentDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dailyConversions = await _context.Leads
                .Where(l => l.LeadStatus == "Converted" && l.CreatedDate >= startDate)
                .GroupBy(l => l.CreatedDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            for (int i = 6; i >= 0; i--)
            {
                var targetDate = DateTime.UtcNow.Date.AddDays(-i);
                performance.Add(new DailyMetricDTO
                {
                    Date = targetDate.ToString("MMM dd"),
                    Leads = dailyLeads.FirstOrDefault(d => d.Date == targetDate)?.Count ?? 0,
                    EmailsSent = dailyEmails.FirstOrDefault(d => d.Date == targetDate)?.Count ?? 0,
                    Conversions = dailyConversions.FirstOrDefault(d => d.Date == targetDate)?.Count ?? 0
                });
            }

            // Real-time ROI calculation from Analytics history if available
            var latestAnalytics = await _context.Analytics
                .OrderByDescending(a => a.RecordDate)
                .FirstOrDefaultAsync();

            decimal totalRoi = latestAnalytics?.CalculatedROI ?? 0;

            var statusDistribution = await _context.Leads
                .GroupBy(l => l.LeadStatus)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new AnalyticsSummaryDTO
            {
                TotalLeads = totalLeads,
                EmailsSent = emailsSent,
                Conversions = conversions,
                TotalROI = totalRoi,
                PerformanceOverTime = performance,
                LeadStatusDistribution = statusDistribution.Select(s => new StatusDistributionDTO 
                { 
                    Status = s.Status ?? "Unknown", 
                    Count = s.Count 
                }).ToList()
            });
        }

        [HttpGet("campaigns")]
        public async Task<ActionResult<IEnumerable<CampaignMetricDTO>>> GetCampaignMetrics()
        {
            var metrics = await _context.Analytics
                .Include(a => a.Campaign)
                .Select(a => new CampaignMetricDTO
                {
                    CampaignName = a.Campaign.CampaignName,
                    EngagementRate = a.EngagementRate,
                    ConversionRate = a.ConversionRate,
                    CostPerLead = a.CostPerLead,
                    Revenue = a.Revenue
                })
                .ToListAsync();

            return Ok(metrics);
        }
    }
}
