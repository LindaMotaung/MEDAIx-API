using System.Text.Json;

namespace MEDAIx.Api.Service
{
    // Lightweight, dependency-free audit trail: one JSON line per prediction request,
    // so any case can be traced back to what was submitted, which model version
    // handled it, and what came back - without needing a database or an external
    // logging service for this stage of the project.
    public class AuditLogger
    {
        private readonly string _logPath;
        private readonly SemaphoreSlim _writeLock = new(1, 1);

        public AuditLogger(IWebHostEnvironment env)
        {
            var logsDir = Path.Combine(env.ContentRootPath, "Logs");
            Directory.CreateDirectory(logsDir);
            _logPath = Path.Combine(logsDir, "audit-log.jsonl");
        }

        public async Task LogAsync(AuditEntry entry)
        {
            var line = JsonSerializer.Serialize(entry) + Environment.NewLine;

            await _writeLock.WaitAsync();
            try
            {
                await File.AppendAllTextAsync(_logPath, line);
            }
            finally
            {
                _writeLock.Release();
            }
        }
    }

    // Deliberately does not include the uploaded image bytes themselves - only
    // metadata - so this is safe to keep even once real patient data is involved.
    public class AuditEntry
    {
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
        public string RequestId { get; set; }
        public string Modality { get; set; }
        public int FileCount { get; set; }
        public List<string> FileNames { get; set; } = new();
        public string ModelVersion { get; set; }
        public bool Success { get; set; }
        public string Status { get; set; }
        public string Prediction { get; set; }
        public double? Confidence { get; set; }
        public int ValidSlices { get; set; }
        public double? AgreeRate { get; set; }
        public double? PInDomain { get; set; }
        public string AbstainType { get; set; }
        public string AbstainReason { get; set; }
        public string Error { get; set; }
        public long ElapsedMs { get; set; }
    }
}
