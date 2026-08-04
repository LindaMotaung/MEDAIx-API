using System.Text.Json;
using System.Text.Json.Serialization;

namespace MEDAIx.Api.Service
{
    public class HuggingFaceMriService
    {
        private readonly HttpClient _httpClient;

        // Live Space (Linda's account). Kabo's original personal-account Space/domain
        // (kabokablemolefe-medaix-computervisionml.hf.space) has been taken down.
        private const string SPACE_API_URL = "https://lindamot-mri-tumor-classifier.hf.space/api/analyze";

        public HuggingFaceMriService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<MriPredictionResult> AnalyzeMriScan(IReadOnlyList<(byte[] Data, string FileName)> files)
        {
            if (files == null || files.Count == 0)
                throw new ArgumentException("At least one image/slice is required.", nameof(files));

            try
            {
                using var content = new MultipartFormDataContent();
                foreach (var (data, fileName) in files)
                {
                    var fileContent = new ByteArrayContent(data);
                    // Field name must be "files" to match the FastAPI route's `files: List[UploadFile]` param.
                    content.Add(fileContent, "files", fileName);
                }

                var response = await _httpClient.PostAsync(SPACE_API_URL, content);

                var resultJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    throw new Exception($"API Error: {response.StatusCode} - {resultJson}");

                var parsed = JsonSerializer.Deserialize<HuggingFaceAnalyzeResponse>(
                    resultJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (parsed == null)
                    throw new Exception("No predictions returned from ML engine.");

                return new MriPredictionResult
                {
                    Status = parsed.Status,
                    AbstainType = parsed.AbstainType,
                    AbstainReason = parsed.AbstainReason,
                    Prediction = parsed.Prediction,
                    Confidence = parsed.Confidence,
                    Probabilities = parsed.Probabilities,
                    ValidSlices = parsed.ValidSlices,
                    AgreeRate = parsed.AgreeRate,
                    PInDomain = parsed.PInDomain,
                    Warnings = parsed.Warnings ?? new List<string>(),
                    Heatmaps = parsed.Heatmaps ?? new List<HeatmapSlice>(),
                    ModelVersion = parsed.ModelVersion ?? "unknown",
                    RawResponse = resultJson
                };
            }
            catch (Exception ex) when (ex is not ArgumentException)
            {
                throw new Exception($"Failed to analyze MRI scan: {ex.Message}", ex);
            }
        }
    }

    // Mirrors the JSON shape returned by /api/analyze in the mri-policy-guarded-classifier Space
    // (FastAPI/Python side returns snake_case keys, so each field needs an explicit mapping).
    public class HuggingFaceAnalyzeResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("abstain_type")]
        public string AbstainType { get; set; }

        [JsonPropertyName("abstain_reason")]
        public string AbstainReason { get; set; }

        [JsonPropertyName("prediction")]
        public string Prediction { get; set; }

        [JsonPropertyName("confidence")]
        public double? Confidence { get; set; }

        [JsonPropertyName("probabilities")]
        public Dictionary<string, double> Probabilities { get; set; }

        [JsonPropertyName("valid_slices")]
        public int ValidSlices { get; set; }

        [JsonPropertyName("agree_rate")]
        public double AgreeRate { get; set; }

        [JsonPropertyName("p_in_domain")]
        public double? PInDomain { get; set; }

        [JsonPropertyName("warnings")]
        public List<string> Warnings { get; set; }

        [JsonPropertyName("heatmaps")]
        public List<HeatmapSlice> Heatmaps { get; set; }

        [JsonPropertyName("model_version")]
        public string ModelVersion { get; set; }
    }

    // A CAM overlay for one slice - shows where the model's evidence for its
    // top predicted label is concentrated on that slice.
    public class HeatmapSlice
    {
        [JsonPropertyName("slice_index")]
        public int SliceIndex { get; set; }

        [JsonPropertyName("label")]
        public string Label { get; set; }

        [JsonPropertyName("image_base64")]
        public string ImageBase64 { get; set; }
    }

    public class MriPredictionResult
    {
        // "ACCEPT" or "ABSTAIN"
        public string Status { get; set; }
        public string AbstainType { get; set; }
        public string AbstainReason { get; set; }
        public string Prediction { get; set; }
        public double? Confidence { get; set; }
        public Dictionary<string, double> Probabilities { get; set; }
        public int ValidSlices { get; set; }
        public double AgreeRate { get; set; }
        public double? PInDomain { get; set; }
        public List<string> Warnings { get; set; } = new();
        public List<HeatmapSlice> Heatmaps { get; set; } = new();
        public string ModelVersion { get; set; }
        public string RawResponse { get; set; }
    }
}
