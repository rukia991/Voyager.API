using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Voyager.API.DTOs;
using Voyager.API.Models;

namespace Voyager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly Voyager.API.Data.VoyagerDbContext _context;

        public AuthController(
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            IConfiguration configuration,
            Voyager.API.Data.VoyagerDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email already exists." });

            // Handle Tenant Association
            int targetTenantId;
            string finalRole;

            if (dto.TenantIdEntry.HasValue && dto.TenantIdEntry > 0)
            {
                // Joins an existing agency as a Customer
                targetTenantId = dto.TenantIdEntry.Value;
                finalRole = "Customer";
            }
            else
            {
                // Creates a new Agency (Admin)
                var tenant = new Tenant
                {
                    CompanyName = dto.FirstName + "'s Company",
                    SubscriptionPlan = string.IsNullOrWhiteSpace(dto.SubscriptionPlan) ? "Basic" : dto.SubscriptionPlan,
                    CreatedDate = DateTime.UtcNow
                };
                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();
                targetTenantId = tenant.TenantId;
                finalRole = "Admin";
            }

            var user = new User
            {
                TenantId = targetTenantId,
                FirstName = dto.FirstName,
                MiddleName = dto.MiddleName,
                LastName = dto.LastName,
                Email = dto.Email,
                UserName = dto.UserName,
                Role = finalRole,
                AccountStatus = "Active",
                CreatedDate = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roleExists = await _roleManager.RoleExistsAsync(finalRole);
            if (roleExists)
                await _userManager.AddToRoleAsync(user, finalRole);

            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email)
                       ?? await _userManager.FindByNameAsync(dto.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
                return Unauthorized(new { message = "Invalid email or password." });

            if (user.AccountStatus != "Active")
                return Unauthorized(new { message = "Account is inactive or suspended." });

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            var tenant = await _context.Tenants.FindAsync(user.TenantId);
            var plan = tenant?.SubscriptionPlan ?? "Basic";

            var token = GenerateJwtToken(user, role, plan);
            var expiry = DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:ExpiryInDays"]!));

            return Ok(new AuthResponseDTO
            {
                Token = token,
                UserName = user.UserName!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                DisplayName = $"{user.FirstName} {user.LastName}".Trim(),
                Email = user.Email!,
                Role = role,
                SubscriptionPlan = plan,
                TenantId = user.TenantId,
                Expiry = expiry
            });
        }

        private string GenerateJwtToken(User user, string role, string plan)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Role, role),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("TenantId", user.TenantId.ToString()),
                new Claim("SubscriptionPlan", plan)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry = DateTime.UtcNow.AddDays(int.Parse(jwtSettings["ExpiryInDays"]!));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiry,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
