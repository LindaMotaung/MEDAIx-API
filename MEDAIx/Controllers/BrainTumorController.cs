using System.Linq;
using MEDAIx.Api.DataTransferObject;
using MEDAIx.Api.Service;
using Microsoft.AspNetCore.Mvc;

namespace MEDAIx.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrainTumorController : ControllerBase
    {
        private readonly HuggingFaceMriService _mriService;
        private readonly ILogger<BrainTumorController> _logger;

        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png" };

        public BrainTumorController(HuggingFaceMriService mriService, ILogger<BrainTumorController> logger)
        {
            _mriService = mriService;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeBrainScan([FromForm] BrainTumorScanRequest request)
        {
            try
            {
                // Accept either the multi-slice "Files" list (preferred - the model needs
                // >= 3 valid slices per case or it will ABSTAIN) or a single legacy "File".
                var uploads = (request.Files != null && request.Files.Count > 0)
                    ? request.Files
                    : (request.File != null ? new List<IFormFile> { request.File } : new List<IFormFile>());

                if (uploads.Count == 0)
                {
                    return BadRequest("No file uploaded");
                }

                foreach (var upload in uploads)
                {
                    var extension = Path.GetExtension(upload.FileName).ToLowerInvariant();
                    if (!AllowedExtensions.Contains(extension))
                    {
                        return BadRequest($"Only JPG, JPEG, and PNG files are allowed (got '{upload.FileName}')");
                    }
                }

                var files = new List<(byte[] Data, string FileName)>();
                foreach (var upload in uploads)
                {
                    using var memoryStream = new MemoryStream();
                    await upload.CopyToAsync(memoryStream);
                    files.Add((memoryStream.ToArray(), upload.FileName));
                }

                var result = await _mriService.AnalyzeMriScan(files);

                return Ok(new
                {
                    success = true,
                    status = result.Status,
                    abstainType = result.AbstainType,
                    abstainReason = result.AbstainReason,
                    prediction = result.Prediction,
                    confidence = result.Confidence,
                    probabilities = result.Probabilities,
                    validSlices = result.ValidSlices,
                    agreeRate = result.AgreeRate,
                    pInDomain = result.PInDomain,
                    warnings = result.Warnings,
                    heatmaps = result.Heatmaps.Select(h => new
                    {
                        sliceIndex = h.SliceIndex,
                        label = h.Label,
                        imageBase64 = h.ImageBase64
                    })
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
    }
}
