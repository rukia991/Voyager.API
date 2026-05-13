using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
            var defaultTenantId = await EnsureDefaultTenantAsync(context);

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

            var seedUsers = new List<(string Username, string Email, string Password, string Role, string FirstName, string LastName)>
            {
                ("superadmin", "superadmin@voyagerplus.com", "SuperAdmin@123", "SuperAdmin", "Super", "Admin"),
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
                        TenantId = defaultTenantId,
                        UserName = seed.Username,
                        Email = seed.Email,
                        FirstName = seed.FirstName,
                        LastName = seed.LastName,
                        Role = seed.Role,
                        AccountStatus = "Active",
                        CreatedDate = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(user, seed.Password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, seed.Role);
                    }
                }
            }
        }

        private static async Task<int> EnsureDefaultTenantAsync(VoyagerDbContext context)
        {
            var tenant = await context.Tenants
                .OrderBy(t => t.TenantId)
                .FirstOrDefaultAsync(t => t.CompanyName == "Voyager System Inc.");

            if (tenant != null)
            {
                return tenant.TenantId;
            }

            tenant = new Tenant
            {
                CompanyName = "Voyager System Inc.",
                SubscriptionPlan = "Default",
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();
            return tenant.TenantId;
        }
    }
}
