import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              marginBottom: -3,
            }}
          >
            <div
              style={{
                width: 9,
                height: 14,
                background: "#86EFAC",
                borderRadius: "50% 50% 0 50%",
                transform: "rotate(-20deg)",
              }}
            />
            <div
              style={{
                width: 10,
                height: 16,
                background: "#4ADE80",
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(20deg)",
              }}
            />
          </div>
          <div
            style={{
              width: 4,
              height: 8,
              background: "#86EFAC",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
