using System.Text;
using System.Text.Json;

namespace MEDAIx.Api.Service
{
    public class HuggingFaceMriService
    {
        private readonly HttpClient _httpClient;
        private const string SPACE_URL = "https://kabokablemolefe-medaix-computervisionml.hf.space/predict";

        public HuggingFaceMriService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<MriPredictionResult> AnalyzeMriScan(byte[] imageData, string fileName)
        {
            try
            {
                string base64Image = Convert.ToBase64String(imageData);
                string dataUrl = $"data:image/jpeg;base64,{base64Image}";

                var requestBody = new
                {
                    data = new object[] { dataUrl }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{SPACE_URL}", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"API Error: {response.StatusCode} - {errorContent}");
                }

                var resultJson = await response.Content.ReadAsStringAsync();

                var predictions = JsonSerializer.Deserialize<Dictionary<string, double>>(resultJson);

                if (predictions == null || predictions.Count == 0)
                    throw new Exception("No predictions returned from ML engine.");

                var recommended = predictions.OrderByDescending(x => x.Value).First();

                return new MriPredictionResult
                {
                    Prediction = recommended.Key,
                    Confidence = recommended.Value.ToString("P2"),
                    RawResponse = resultJson
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to analyze MRI scan: {ex.Message}", ex);
            }
        }
    }

    public class MriPredictionResult
    {
        public string Prediction { get; set; }
        public string Confidence { get; set; }
        public string RawResponse { get; set; }
    }
}
