using System.Text.Json;
using System.Text.Json.Serialization;

namespace Voyager.API.Services
{
    public class RecaptchaService : IRecaptchaService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RecaptchaService> _logger;

        public RecaptchaService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<RecaptchaService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> VerifyAsync(string token, string expectedAction, string remoteIpAddress)
        {
            var isDevelopment = string.Equals(
                _configuration["ASPNETCORE_ENVIRONMENT"],
                "Development",
                StringComparison.OrdinalIgnoreCase);

            if (isDevelopment && (string.IsNullOrWhiteSpace(token) || token == "dev-bypass"))
            {
                _logger.LogInformation("Bypassing reCAPTCHA validation in Development for action {Action}.", expectedAction);
                return true;
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            var secretKey = _configuration["Recaptcha:SecretKey"];
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                _logger.LogWarning("reCAPTCHA secret key is not configured.");
                return false;
            }

            using var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://www.google.com/recaptcha/api/siteverify")
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["secret"] = secretKey,
                    ["response"] = token,
                    ["remoteip"] = remoteIpAddress
                })
            };

            using var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync();
            var payload = await JsonSerializer.DeserializeAsync<RecaptchaVerifyResponse>(stream);
            if (payload == null)
            {
                return false;
            }

            var isValid = payload.Success;

            if (!isValid)
            {
                _logger.LogWarning(
                   "reCAPTCHA failed. ErrorCodes={Codes}",
        string.Join(", ", payload.ErrorCodes ?? []));
            }

            return isValid;
        }

        private sealed class RecaptchaVerifyResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }

            [JsonPropertyName("error-codes")]
            public List<string>? ErrorCodes { get; set; }
        }
    }
}
