using System.Diagnostics;
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
        private readonly AuditLogger _auditLogger;
        private readonly ILogger<BrainTumorController> _logger;

        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png" };

        public BrainTumorController(HuggingFaceMriService mriService, AuditLogger auditLogger, ILogger<BrainTumorController> logger)
        {
            _mriService = mriService;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeBrainScan([FromForm] BrainTumorScanRequest request)
        {
            var requestId = Guid.NewGuid().ToString();
            var stopwatch = Stopwatch.StartNew();
            List<IFormFile> uploads = new();

            try
            {
                // Accept either the multi-slice "Files" list (preferred - the model needs
                // >= 3 valid slices per case or it will ABSTAIN) or a single legacy "File".
                uploads = (request.Files != null && request.Files.Count > 0)
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

                await _auditLogger.LogAsync(new AuditEntry
                {
                    RequestId = requestId,
                    Modality = "brain-mri",
                    FileCount = uploads.Count,
                    FileNames = uploads.Select(u => u.FileName).ToList(),
                    ModelVersion = result.ModelVersion,
                    Success = true,
                    Status = result.Status,
                    Prediction = result.Prediction,
                    Confidence = result.Confidence,
                    ValidSlices = result.ValidSlices,
                    AgreeRate = result.AgreeRate,
                    PInDomain = result.PInDomain,
                    AbstainType = result.AbstainType,
                    AbstainReason = result.AbstainReason,
                    ElapsedMs = stopwatch.ElapsedMilliseconds
                });

                return Ok(new
                {
                    success = true,
                    requestId,
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
                    modelVersion = result.ModelVersion,
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

                await _auditLogger.LogAsync(new AuditEntry
                {
                    RequestId = requestId,
                    Modality = "brain-mri",
                    FileCount = uploads.Count,
                    FileNames = uploads.Select(u => u.FileName).ToList(),
                    Success = false,
                    Error = ex.Message,
                    ElapsedMs = stopwatch.ElapsedMilliseconds
                });

                return StatusCode(500, new
                {
                    success = false,
                    requestId,
                    error = ex.Message
                });
            }
        }
    }
}
