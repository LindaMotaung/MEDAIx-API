import React, { useState } from "react";

// Local dev talks to the .NET API running on localhost; the production build
// (set via .env.production) talks to the real deployed API instead.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://localhost:7167";

const CLASS_LABELS = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary",
  "no tumor": "No Tumor",
  notumor: "No Tumor",
};

function getHighestClass(predictions) {
  return Object.entries(predictions).reduce(
    (max, [key, value]) => (value > max.value ? { key, value } : max),
    { key: null, value: -Infinity }
  );
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("Files", f));

    try {
      const response = await fetch(`${API_BASE_URL}/api/BrainTumor/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to get prediction");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const highest =
    result && result.status === "ACCEPT" && result.probabilities
      ? getHighestClass(result.probabilities)
      : null;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Solapa X — MRI Brain Tumor Classifier</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Upload all slices for one scan (at least 3 valid slices needed, or the
          case will come back as ABSTAIN).
        </div>
        {previews.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Slice ${i + 1}`}
                style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }}
              />
            ))}
          </div>
        )}
        <button
          type="submit"
          disabled={files.length === 0 || loading}
          style={{
            padding: "10px 24px",
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
      {error && (
        <div style={{ color: "#d32f2f", marginBottom: 16, textAlign: "center" }}>
          {error}
        </div>
      )}
      {result && result.status !== "ACCEPT" && (
        <div
          style={{
            background: "#222",
            color: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginTop: 0 }}>ABSTAIN{result.abstainType ? ` (${result.abstainType})` : ""}</h3>
          <div style={{ color: "#ccc", marginBottom: 8 }}>
            {result.abstainReason || "Model declined to give a case-level prediction."}
          </div>
          <div style={{ fontSize: 13, color: "#999" }}>
            Valid slices used: {result.validSlices}
          </div>
        </div>
      )}
      {result && result.status === "ACCEPT" && result.probabilities && (
        <div
          style={{
            background: "#222",
            color: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, textAlign: "center" }}>
            Classification Results
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {Object.entries(result.probabilities).map(([key, value]) => (
              <li
                key={key}
                style={{
                  marginBottom: 12,
                  padding: "8px 0",
                  background:
                    highest && highest.key === key ? "#d32f2f" : "transparent",
                  color: highest && highest.key === key ? "#fff" : "#ccc",
                  borderRadius: 4,
                  fontWeight: highest && highest.key === key ? "bold" : "normal",
                  fontSize: 18,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{CLASS_LABELS[key.toLowerCase()] || key}</span>
                <span>{(value * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
          {highest && (
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
                color: "#d32f2f",
              }}
            >
              Recommended: {CLASS_LABELS[highest.key.toLowerCase()] || highest.key}
            </div>
          )}
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#999" }}>
            Agreement across slices: {(result.agreeRate * 100).toFixed(0)}% ({result.validSlices} valid slices)
          </div>
        </div>
      )}
      {result && result.heatmaps && result.heatmaps.length > 0 && (
        <div
          style={{
            background: "#222",
            color: "#fff",
            borderRadius: 8,
            padding: 24,
            marginTop: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8, textAlign: "center" }}>
            Where the model is looking
          </h3>
          <div style={{ fontSize: 12, color: "#999", textAlign: "center", marginBottom: 16 }}>
            Per-slice evidence heatmap for each slice's top predicted label
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            {result.heatmaps.map((h) => (
              <div key={h.sliceIndex} style={{ textAlign: "center" }}>
                <img
                  src={`data:image/png;base64,${h.imageBase64}`}
                  alt={`Slice ${h.sliceIndex} heatmap`}
                  style={{ width: 140, height: 140, borderRadius: 8, display: "block" }}
                />
                <div style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
                  slice {h.sliceIndex}: {CLASS_LABELS[(h.label || "").toLowerCase()] || h.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
