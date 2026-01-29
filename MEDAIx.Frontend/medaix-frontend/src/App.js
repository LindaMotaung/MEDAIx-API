import React, { useState } from "react";

const CLASS_LABELS = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary",
  notumor: "No Tumor",
};

function getHighestClass(predictions) {
  return Object.entries(predictions).reduce(
    (max, [key, value]) => (value > max.value ? { key, value } : max),
    { key: null, value: -Infinity }
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("File", file);

    try {
      const response = await fetch("https://localhost:7167/api/BrainTumor/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction");
      }

      const data = await response.json();
      // Assume details is a JSON string, parse it
      const predictions =
        typeof data.details === "string"
          ? JSON.parse(data.details)
          : data.details;

      setResult(predictions);
    } catch (err) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const highest = result ? getHighestClass(result) : null;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>MEDAIX MRI Brain Tumor Classifier</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        {preview && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={!file || loading}
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
      {result && (
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
            {Object.entries(result).map(([key, value]) => (
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
        </div>
      )}
    </div>
  );
}