import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F6F1",
          borderRadius: 36,
          fontFamily: "Georgia, serif",
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#2D2D2D",
            letterSpacing: "-0.04em",
          }}
        >
          T
        </span>
      </div>
    ),
    { ...size }
  );
}
