import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TONE TOKYO — Japan, Through the Eyes of Someone Who Lives It";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F6F1",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#2D2D2D",
              letterSpacing: "-0.02em",
            }}
          >
            TONE
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "0.25em",
              color: "#A39E93",
              textTransform: "uppercase" as const,
            }}
          >
            TOKYO
          </span>
        </div>
        <div
          style={{
            width: 80,
            height: 3,
            background: "#1B3A5C",
            marginTop: 24,
            marginBottom: 28,
          }}
        />
        <span
          style={{
            fontSize: 24,
            color: "#A39E93",
            letterSpacing: "0.04em",
          }}
        >
          Japan, Through the Eyes of Someone Who Lives It
        </span>
      </div>
    ),
    { ...size }
  );
}
