using MEDAIx.Api.DataTransferObject;
using MEDAIx.Api.Service;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

namespace MEDAIx.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrainTumorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly HuggingFaceMriService _mriService;
        private readonly ILogger<BrainTumorController> _logger;

        public BrainTumorController(IHttpClientFactory httpClientFactory, HuggingFaceMriService mriService, ILogger<BrainTumorController> logger)
        {
            _mriService = mriService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeBrainScan([FromForm] BrainTumorScanRequest request)
        {
            try
            {
                if (request.File == null || request.File.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Only JPG, JPEG, and PNG files are allowed");
                }

                // Read file into byte array
                byte[] imageData;
                using (var memoryStream = new MemoryStream())
                {
                    await request.File.CopyToAsync(memoryStream);
                    imageData = memoryStream.ToArray();
                }

                // Call the ML service
                var result = await _mriService.AnalyzeMriScan(imageData, request.File.FileName);

                return Ok(new
                {
                    success = true,
                    fileName = request.File.FileName,
                    prediction = result.Prediction,
                    confidence = result.Confidence,
                    details = result.RawResponse
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing MRI scan");
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BrainTumorScan([FromForm] BrainTumorScanRequest request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest("MRI image file is required.");

            var client = _httpClientFactory.CreateClient();

            using var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(file.OpenReadStream());
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            content.Add(streamContent, "file", file.FileName);

            var response = await client.PostAsync(
                "https://huggingface.co/spaces/KaboKableMolefe/MEDAIx-ComputerVisionML",
                content
            );

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "ML engine inference failed.");

            var result = await response.Content.ReadAsStringAsync();

            return Ok(new
            {
                mlResponse = result
            });
        }
    }
}
