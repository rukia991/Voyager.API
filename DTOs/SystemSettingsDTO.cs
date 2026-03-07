namespace Voyager.API.DTOs
{
    public class SystemSettingsDTO
    {
        public string MapboxAccessToken { get; set; } = string.Empty;
        public string EmailSmtpHost { get; set; } = string.Empty;
        public int EmailSmtpPort { get; set; }
        public string EmailSender { get; set; } = string.Empty;
    }
}
