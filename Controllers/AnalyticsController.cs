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
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            int? tenantId = string.IsNullOrEmpty(tenantIdClaim) || tenantIdClaim == "0" ? null : int.Parse(tenantIdClaim);

            var leadsQuery = _context.Leads.AsQueryable();
            var emailLogsQuery = _context.EmailLogs.AsQueryable();

            if (!isSuperAdmin && tenantId.HasValue)
            {
                leadsQuery = leadsQuery.Where(l => l.TenantId == tenantId.Value);
                emailLogsQuery = emailLogsQuery.Where(e => e.TenantId == tenantId.Value);
            }

            var totalLeads = await leadsQuery.CountAsync();
            var emailsSent = await emailLogsQuery.CountAsync();
            var conversions = await leadsQuery.CountAsync(l => l.LeadStatus == "Converted");
            
            // Calculate Performance Over Time (Bounded by Tenant Creation Date)
            var graphStartDate = DateTime.UtcNow.Date.AddDays(-6);
            if (tenantId.HasValue)
            {
                var tenant = await _context.Tenants.FindAsync(tenantId.Value);
                if (tenant != null && tenant.CreatedDate.Date > graphStartDate)
                {
                    graphStartDate = tenant.CreatedDate.Date;
                }
            }

            var startDate = graphStartDate;
            var performance = new List<DailyMetricDTO>();
            int daysToCover = (DateTime.UtcNow.Date - startDate).Days;

            var dailyLeads = await leadsQuery
                .Where(l => l.CreatedDate >= startDate)
                .GroupBy(l => l.CreatedDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dailyEmails = await emailLogsQuery
                .Where(e => e.SentDate >= startDate)
                .GroupBy(e => e.SentDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dailyConversions = await leadsQuery
                .Where(l => l.LeadStatus == "Converted" && l.CreatedDate >= startDate)
                .GroupBy(l => l.CreatedDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            for (int i = daysToCover; i >= 0; i--)
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

            var analyticsQuery = _context.Analytics.AsQueryable();
            if (!isSuperAdmin && tenantId.HasValue)
            {
                analyticsQuery = analyticsQuery.Where(a => a.TenantId == tenantId.Value);
            }

            var latestAnalytics = await analyticsQuery
                .OrderByDescending(a => a.RecordDate)
                .FirstOrDefaultAsync();

            decimal totalRoi = latestAnalytics?.CalculatedROI ?? 0;

            var statusDistribution = await leadsQuery
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
