import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e1a",
          borderRadius: "22%",
        }}
      >
        <span
          style={{
            fontSize: 280,
            fontWeight: 700,
            color: "#0066ff",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: "-0.05em",
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size },
  );
}
