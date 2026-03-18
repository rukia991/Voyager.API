using System.Security.Claims;

namespace Voyager.API.Services
{
    public class TenantService : ITenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int GetTenantId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return 0; // 0 usually means no tenant or system-level access.

            var tenantClaim = user.FindFirst("TenantId");
            if (tenantClaim != null && int.TryParse(tenantClaim.Value, out var tenantId))
            {
                return tenantId;
            }

            return 0;
        }
    }
}
