using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace MEDAIx.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrainTumorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public BrainTumorController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet]
        public bool SomeTest() 
        {
            return true;
        }

        //[HttpPost]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> BrainTumorScan([FromForm] IFormFile file) 
        //{
        //    if (file == null || file.Length == 0)
        //        return BadRequest("MRI image file is required.");

        //    // Create multipart request to ML engine
        //    var client = _httpClientFactory.CreateClient();

        //    using var content = new MultipartFormDataContent();
        //    var streamContent = new StreamContent(file.OpenReadStream());
        //    streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

        //    // Call Python ML service
        //    var response = await client.PostAsync(
        //        "http://localhost:8000/predict/brain-tumor",
        //        content
        //    );

        //    if (!response.IsSuccessStatusCode)
        //        return StatusCode(500, "ML engine inference failed.");

        //    var predictions =
        //        await response.Content.ReadFromJsonAsync<Dictionary<string, double>>();

        //    if (predictions == null || predictions.Count == 0)
        //        return StatusCode(500, "Invalid ML response.");

        //    var top = predictions.OrderByDescending(p => p.Value).First();

        //    return Ok(new
        //    {
        //        recommendation = MapLabel(top.Key),
        //        confidence = Math.Round(top.Value, 3),
        //        predictions
        //    });
        //}

        private static string MapLabel(string key) => key switch
        {
            "glioma" => "Glioma",
            "meningioma" => "Meningioma",
            "pituitary" => "Pituitary",
            "notumor" => "No Tumor",
            _ => "Unknown"
        };
    }
}
