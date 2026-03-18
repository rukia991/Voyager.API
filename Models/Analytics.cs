namespace Voyager.API.Models
{
    public class Analytics
    {
        public int AnalyticsID { get; set; }
        public int TenantId { get; set; }
        public int CampaignID { get; set; }
        public int TotalLeads { get; set; }
        public int EmailsSent { get; set; }
        public int EmailsOpened { get; set; }
        public int EmailsClicked { get; set; }
        public int Conversions { get; set; }
        public decimal EngagementRate { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal Revenue { get; set; }
        public decimal CostPerLead { get; set; }
        public decimal CalculatedROI { get; set; }
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Tenant Tenant { get; set; } = null!;
        public Campaign Campaign { get; set; } = null!;
    }
}