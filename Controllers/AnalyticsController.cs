using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Data;
using Voyager.API.DTOs;

namespace Voyager.API.Controllers
{
    [Authorize]
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
            
            // Mocking some time-series data for the charts
            var performance = new List<DailyMetricDTO>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.AddDays(-i).ToString("MMM dd");
                performance.Add(new DailyMetricDTO
                {
                    Date = date,
                    Leads = Random.Shared.Next(10, 50),
                    EmailsSent = Random.Shared.Next(50, 200),
                    Conversions = Random.Shared.Next(1, 10)
                });
            }

            var statusDistribution = await _context.Leads
                .GroupBy(l => l.LeadStatus)
                .Select(g => new StatusDistributionDTO
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return Ok(new AnalyticsSummaryDTO
            {
                TotalLeads = totalLeads,
                EmailsSent = emailsSent,
                Conversions = conversions,
                TotalROI = 24.5m, // Mock ROI
                PerformanceOverTime = performance,
                LeadStatusDistribution = statusDistribution
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
