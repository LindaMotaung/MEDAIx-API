namespace MEDAIx.Domain
{
    public class Classification
    {
        public Dictionary<string, double> Predictions { get; set; } = new();
        public string RecommendedClass { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public DateTime ProcessedAt { get; set; }
    }
}
