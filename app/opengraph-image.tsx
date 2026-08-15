import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#07080a",
          padding: "90px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: "#f4f6f4",
            letterSpacing: -1,
          }}
        >
          Sports Betting Scanner
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#a2a89c",
            marginTop: 28,
            maxWidth: 940,
          }}
        >
          +EV scanner comparing Kalshi &amp; Polymarket prices against de-vigged sportsbook odds.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#eda100",
            marginTop: 48,
            fontWeight: 600,
          }}
        >
          sports-betting-web.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
