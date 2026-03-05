namespace Voyager.API.DTOs
{
    public class AnalyticsSummaryDTO
    {
        public int TotalLeads { get; set; }
        public int EmailsSent { get; set; }
        public int Conversions { get; set; }
        public decimal TotalROI { get; set; }
        public List<DailyMetricDTO> PerformanceOverTime { get; set; } = new List<DailyMetricDTO>();
        public List<StatusDistributionDTO> LeadStatusDistribution { get; set; } = new List<StatusDistributionDTO>();
    }

    public class DailyMetricDTO
    {
        public string Date { get; set; } = string.Empty;
        public int Leads { get; set; }
        public int EmailsSent { get; set; }
        public int Conversions { get; set; }
    }

    public class StatusDistributionDTO
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class CampaignMetricDTO
    {
        public string CampaignName { get; set; } = string.Empty;
        public decimal EngagementRate { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal CostPerLead { get; set; }
        public decimal Revenue { get; set; }
    }
}
