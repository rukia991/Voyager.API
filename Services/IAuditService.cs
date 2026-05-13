namespace Voyager.API.Services
{
    public interface IAuditService
    {
        Task LogAsync(
            int? userId,
            string email,
            string action,
            string module,
            string details,
            string ipAddress,
            bool isSuccess = true,
            bool isSuspicious = false);
    }
}
