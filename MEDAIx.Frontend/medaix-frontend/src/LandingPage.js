import React from "react";
import { Link } from "react-router-dom";

const COLORS = {
  ink: "#1B2430",
  inkSoft: "#4A5560",
  accent: "#C4502A",
  accentSoft: "#E7DAD3",
  bg: "#F2F4F6",
};

function CheckItem({ children }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        fontSize: 15,
        color: COLORS.inkSoft,
        lineHeight: 1.5,
      }}
    >
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
          marginTop: 1,
        }}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function PrincipleCard({ title, children }) {
  return (
    <div
      style={{
        flex: "1 1 240px",
        background: "#fff",
        border: `1px solid ${COLORS.accentSoft}`,
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: COLORS.ink }}>{title}</div>
      <div style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        color: COLORS.ink,
        background: COLORS.bg,
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "64px 24px 80px" }}>
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
          solapa x
        </div>

        <h1 style={{ fontSize: 36, lineHeight: 1.2, margin: "0 0 16px" }}>
          The confidence of a second opinion, without the wait.
        </h1>

        <p style={{ fontSize: 17, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 640 }}>
          Solapa X screens brain MRI slices for glioma, meningioma, and pituitary
          tumors in seconds - and it's honest when a scan doesn't give it enough
          to go on, rather than forcing a guess.
        </p>

        <div style={{ marginTop: 28, marginBottom: 56, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            to="/demo"
            style={{
              display: "inline-block",
              background: COLORS.accent,
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Try the demo →
          </Link>
        </div>

        <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Everything a reviewer needs, on one screen.</h2>
        <p style={{ fontSize: 14, color: COLORS.inkSoft, marginBottom: 8 }}>
          Upload a scan's slices and get back:
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 48px", maxWidth: 560 }}>
          <CheckItem>
            A calibrated confidence score, temperature-scaled against held-out
            data - so "99% confident" actually means something.
          </CheckItem>
          <CheckItem>
            An automatic abstain when a scan looks unlike anything in training
            data, instead of a forced best guess.
          </CheckItem>
          <CheckItem>
            A per-slice heatmap showing exactly where the model's evidence is
            concentrated.
          </CheckItem>
          <CheckItem>
            Agreement tracking across every slice in the scan, not just a
            single frame.
          </CheckItem>
        </ul>

        <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>Built for radiologist-led review.</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <PrincipleCard title="Knows what it doesn't know">
            An honest abstain beats a confident wrong answer - the model
            declines rather than forces a call on scans unlike its training
            data.
          </PrincipleCard>
          <PrincipleCard title="Nothing is a black box">
            Every accepted result ships with the evidence behind it: a
            per-slice heatmap, not just a number.
          </PrincipleCard>
        </div>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${COLORS.accentSoft}`,
            borderRadius: 10,
            padding: "28px 24px",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            See it classify a real scan in under a minute.
          </div>
          <Link
            to="/demo"
            style={{
              display: "inline-block",
              background: COLORS.accent,
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Try the demo →
          </Link>
        </div>

        <div
          style={{
            borderTop: `1px solid ${COLORS.accentSoft}`,
            paddingTop: 24,
            fontSize: 13,
            color: COLORS.inkSoft,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: COLORS.ink }}>Current stage:</strong> pre-clinical
          MVP, built for radiologist-led validation ahead of any clinical use.
          Solapa X is not a diagnostic device and is not intended for clinical
          decision-making today.
        </div>
      </div>
    </div>
  );
}
