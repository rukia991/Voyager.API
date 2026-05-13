using Voyager.API.Data;
using Voyager.API.Models;

namespace Voyager.API.Services
{
    public class AuditService : IAuditService
    {
        private readonly VoyagerDbContext _context;

        public AuditService(VoyagerDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            int? userId,
            string email,
            string action,
            string module,
            string details,
            string ipAddress,
            bool isSuccess = true,
            bool isSuspicious = false)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Email = email,
                Action = action,
                Module = module,
                Details = details,
                IpAddress = ipAddress,
                IsSuccess = isSuccess,
                IsSuspicious = isSuspicious,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}
