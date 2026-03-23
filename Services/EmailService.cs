using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Voyager.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendAsync(string to, string toName, string subject, string htmlBody)
        {
            var host = _config["Email:SmtpHost"]!;
            var port = int.Parse(_config["Email:SmtpPort"]!);
            var sender = _config["Email:Sender"]!;
            var password = _config["Email:Password"]!;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Voyager Marketing", sender));
            message.To.Add(new MailboxAddress(toName, to));
            message.Subject = subject;
            // Note: If campaign specific variables are available, they would be injected here.
            // As this is a generic SendAsync, we will try to resolve the generic CTA token if present.
            string finalBody = htmlBody;
            if (htmlBody.Contains("{{registrationLink}}"))
            {
                var targetTenantId = 0; // We will extract this or default.
                finalBody = htmlBody.Replace("{{registrationLink}}", "http://localhost:5173/register?tid=12");
            }
            message.Body = new TextPart("html") { Text = finalBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(sender, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {To} with subject '{Subject}'", to, subject);
        }
    }
}
