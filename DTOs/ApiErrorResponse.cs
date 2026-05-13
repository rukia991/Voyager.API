namespace Voyager.API.DTOs
{
    public class ApiErrorResponse
    {
        public string Message { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public object? Errors { get; set; }
    }
}
