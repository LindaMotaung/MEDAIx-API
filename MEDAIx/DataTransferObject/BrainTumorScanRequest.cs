using Microsoft.AspNetCore.Http;

namespace MEDAIx.Api.DataTransferObject
{
    public class BrainTumorScanRequest
    {
        public IFormFile File { get; set; }
    }
}
