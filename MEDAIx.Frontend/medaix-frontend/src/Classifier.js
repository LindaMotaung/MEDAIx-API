import React, { useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "./theme";

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

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.accentSoft}`,
        borderRadius: 10,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Classifier() {
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
    <div style={{ fontFamily: "sans-serif", color: COLORS.ink, background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 80px" }}>
        <Link
          to="/"
          style={{
            display: "inline-block",
            color: COLORS.accent,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          ← solapa x
        </Link>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.accent,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Live demo
        </div>

        <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: "0 0 12px" }}>
          Brain MRI tumor classifier
        </h1>
        <p style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 32, maxWidth: 520 }}>
          Upload every slice from one scan. The model classifies glioma,
          meningioma, pituitary, or no tumor, with a calibrated confidence
          score and a heatmap for each slice it's willing to call on.
        </p>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            {[
              ["1", "Upload slices"],
              ["2", "Model reviews each one"],
              ["3", "Get a case-level call, or an honest abstain"],
            ].map(([n, label]) => (
              <div key={n} style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: COLORS.accentSoft,
                    color: COLORS.accent,
                    fontWeight: 700,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {n}
                </span>
                <span style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.4 }}>{label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="slice-upload"
              style={{
                display: "block",
                border: `1.5px dashed ${COLORS.accentSoft}`,
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 16,
                background: COLORS.bg,
              }}
            >
              <div style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
                {files.length > 0 ? `${files.length} slice${files.length === 1 ? "" : "s"} selected` : "Choose slice images"}
              </div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                At least 3 valid slices needed, or the case comes back as ABSTAIN
              </div>
              <input
                id="slice-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>

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
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: `1px solid ${COLORS.accentSoft}`,
                    }}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={files.length === 0 || loading}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: files.length === 0 || loading ? COLORS.accentSoft : COLORS.accent,
                color: files.length === 0 || loading ? COLORS.inkSoft : "#fff",
                border: "none",
                borderRadius: 6,
                cursor: files.length === 0 || loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {loading ? "Analyzing..." : "Analyze scan"}
            </button>
          </form>
        </Card>

        {error && (
          <Card style={{ marginBottom: 24, borderColor: COLORS.accent }}>
            <div style={{ color: COLORS.accent, fontWeight: 700, marginBottom: 4 }}>
              Something went wrong
            </div>
            <div style={{ color: COLORS.inkSoft, fontSize: 14 }}>{error}</div>
          </Card>
        )}

        {result && result.status !== "ACCEPT" && (
          <Card style={{ marginBottom: 24, textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                background: COLORS.accentSoft,
                color: COLORS.accent,
                fontWeight: 700,
                fontSize: 13,
                padding: "4px 12px",
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              ABSTAIN{result.abstainType ? ` · ${result.abstainType}` : ""}
            </div>
            <div style={{ color: COLORS.inkSoft, marginBottom: 8, lineHeight: 1.5 }}>
              {result.abstainReason || "Model declined to give a case-level prediction."}
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
              Valid slices used: {result.validSlices}
            </div>
          </Card>
        )}

        {result && result.status === "ACCEPT" && result.probabilities && (
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 17 }}>Classification result</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(result.probabilities).map(([key, value]) => {
                const isTop = highest && highest.key === key;
                return (
                  <li
                    key={key}
                    style={{
                      marginBottom: 10,
                      padding: "10px 14px",
                      background: isTop ? COLORS.accent : COLORS.bg,
                      color: isTop ? "#fff" : COLORS.ink,
                      borderRadius: 6,
                      fontWeight: isTop ? 700 : 500,
                      fontSize: 16,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{CLASS_LABELS[key.toLowerCase()] || key}</span>
                    <span>{(value * 100).toFixed(1)}%</span>
                  </li>
                );
              })}
            </ul>
            {highest && (
              <div
                style={{
                  marginTop: 16,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.accent,
                }}
              >
                Recommended: {CLASS_LABELS[highest.key.toLowerCase()] || highest.key}
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: COLORS.inkSoft }}>
              Agreement across slices: {(result.agreeRate * 100).toFixed(0)}% ({result.validSlices} valid slices)
            </div>
          </Card>
        )}

        {result && result.heatmaps && result.heatmaps.length > 0 && (
          <Card>
            <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 17 }}>Where the model is looking</h3>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
              Per-slice evidence heatmap for each slice's top predicted label
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {result.heatmaps.map((h) => (
                <div key={h.sliceIndex} style={{ textAlign: "center" }}>
                  <img
                    src={`data:image/png;base64,${h.imageBase64}`}
                    alt={`Slice ${h.sliceIndex} heatmap`}
                    style={{
                      width: 130,
                      height: 130,
                      borderRadius: 8,
                      display: "block",
                      border: `1px solid ${COLORS.accentSoft}`,
                    }}
                  />
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
                    slice {h.sliceIndex}: {CLASS_LABELS[(h.label || "").toLowerCase()] || h.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
