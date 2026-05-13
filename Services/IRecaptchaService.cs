namespace Voyager.API.Services
{
    public interface IRecaptchaService
    {
        Task<bool> VerifyAsync(string token, string expectedAction, string remoteIpAddress);
    }
}
