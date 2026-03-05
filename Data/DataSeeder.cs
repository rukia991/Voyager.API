using Voyager.API.Models;

namespace Voyager.API.Data
{
    public static class DataSeeder
    {
        public static async Task SeedDataAsync(VoyagerDbContext context)
        {
            if (!context.CampaignLocations.Any())
            {
                var locations = new List<CampaignLocation>
                {
                    new CampaignLocation { LocationName = "Boracay, Aklan", Description = "World-famous white sand beaches", Latitude = 11.9674m, Longitude = 121.9248m, Country = "Philippines" },
                    new CampaignLocation { LocationName = "El Nido, Palawan", Description = "Stunning limestone cliffs and lagoons", Latitude = 11.1955m, Longitude = 119.4185m, Country = "Philippines" },
                    new CampaignLocation { LocationName = "Siargao, Surigao", Description = "The surfing capital of the Philippines", Latitude = 9.8500m, Longitude = 126.1167m, Country = "Philippines" }
                };
                context.CampaignLocations.AddRange(locations);
                await context.SaveChangesAsync();
            }

            var admin = context.Users.FirstOrDefault(u => u.Role == "SuperAdmin");
            if (admin != null)
            {
                if (!context.Campaigns.Any())
                {
                    var locations = context.CampaignLocations.ToList();
                    context.Campaigns.AddRange(new List<Campaign>
                    {
                        new Campaign
                        {
                            CampaignName = "Boracay Summer Bliss",
                            Description = "Experience the best white sand beach in the world.",
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(2),
                            Budget = 25000,
                            TargetGoal = "50 Bookings",
                            Status = "Active",
                            CreatedBy = admin.Id,
                            LocationID = locations[0].LocationID
                        },
                        new Campaign
                        {
                            CampaignName = "Palawan Island Hopping",
                            Description = "Discover the hidden lagoons of El Nido.",
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(3),
                            Budget = 40000,
                            TargetGoal = "80 Bookings",
                            Status = "Active",
                            CreatedBy = admin.Id,
                            LocationID = locations[1].LocationID
                        },
                        new Campaign
                        {
                            CampaignName = "Siargao Surf Safari",
                            Description = "Catch the world-famous Cloud 9 waves.",
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(4),
                            Budget = 15000,
                            TargetGoal = "30 Bookings",
                            Status = "Active",
                            CreatedBy = admin.Id,
                            LocationID = locations[2].LocationID
                        }
                    });
                    await context.SaveChangesAsync();
                }

                if (!context.EmailTemplates.Any())
                {
                    context.EmailTemplates.Add(new EmailTemplate
                    {
                        TemplateName = "Welcome Series - Premium",
                        Subject = "Welcome to Voyager: Your Next Journey Awaits ✈️",
                        Body = "<h1>Hello!</h1><p>We are thrilled to have you join our exclusive travel community.</p>",
                        IsApproved = "Approved",
                        CreatedBy = admin.Id
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
