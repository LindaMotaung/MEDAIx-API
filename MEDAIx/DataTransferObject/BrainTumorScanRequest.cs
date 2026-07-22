using Microsoft.AspNetCore.Http;

namespace MEDAIx.Api.DataTransferObject
{
    public class BrainTumorScanRequest
    {
        // Single-file upload, kept for backward compatibility with older clients.
        public IFormFile? File { get; set; }

        // The classifier is a case-level, multi-slice model (needs >= 3 valid slices
        // to avoid abstaining) so new clients should upload the full set of slices here.
        public List<IFormFile>? Files { get; set; }
    }
}
