using Microsoft.AspNetCore.Identity;
using Voyager.API.Models;

namespace Voyager.API.Data
{
    public static class RoleSeeder
    {
        public static async Task SeedRolesAndSuperAdminAsync(
            RoleManager<IdentityRole<int>> roleManager,
            UserManager<User> userManager,
            VoyagerDbContext context)
        {
            // Seed Roles
            string[] roles = new[]
            {
                "SuperAdmin",
                "Admin",
                "Marketing Manager",
                "Marketing Staff",
                "Customer"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<int>(role));
                }
            }

            // Seed Fake Tenants
            var demoTenant = context.Tenants.FirstOrDefault(t => t.CompanyName == "Voyager System Inc.");
            if (demoTenant == null)
            {
                demoTenant = new Tenant { CompanyName = "Voyager System Inc.", SubscriptionPlan = "Enterprise" };
                context.Tenants.Add(demoTenant);
                
                var betaTenant = new Tenant { CompanyName = "Travel Beta", SubscriptionPlan = "Pro" };
                context.Tenants.Add(betaTenant);
                await context.SaveChangesAsync();
            }

            // Seed 5 Specific Test Accounts
            var seedUsers = new List<(string Username, string Email, string Password, string Role, string FirstName, string LastName)>
            {
                ("superadmin", "superadmin@voyagerplus.com", "SuperAdmin@123", "SuperAdmin", "Super", "Admin")
            };

            var tenantUsers = new List<(string Username, string Email, string Password, string Role, string FirstName, string LastName)>
            {
                ("admin", "admin@voyagerplus.com", "Admin@123", "Admin", "System", "Admin"),
                ("manager", "manager@voyagerplus.com", "Manager@123", "Marketing Manager", "Marketing", "Manager"),
                ("staff", "staff@voyagerplus.com", "Staff@123", "Marketing Staff", "Marketing", "Staff"),
                ("customer", "customer@voyagerplus.com", "Customer@123", "Customer", "Test", "Customer")
            };

            foreach (var seed in seedUsers)
            {
                var existingUser = await userManager.FindByNameAsync(seed.Username);
                if (existingUser == null)
                {
                    var user = new User
                    {
                        TenantId = demoTenant.TenantId,
                        UserName = seed.Username,
                        Email = seed.Email,
                        FirstName = seed.FirstName,
                        LastName = seed.LastName,
                        Role = seed.Role,
                        AccountStatus = "Active",
                        CreatedDate = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(user, seed.Password);
                    if (result.Succeeded) await userManager.AddToRoleAsync(user, seed.Role);
                }
            }

            foreach (var seed in tenantUsers)
            {
                var existingUser = await userManager.FindByNameAsync(seed.Username);
                if (existingUser == null)
                {
                    var user = new User
                    {
                        TenantId = demoTenant.TenantId,
                        UserName = seed.Username,
                        Email = seed.Email,
                        FirstName = seed.FirstName,
                        LastName = seed.LastName,
                        Role = seed.Role,
                        AccountStatus = "Active",
                        CreatedDate = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(user, seed.Password);
                    if (result.Succeeded) await userManager.AddToRoleAsync(user, seed.Role);
                }
            }
        }
    }
}