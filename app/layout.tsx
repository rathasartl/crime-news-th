import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "อาชญากรรม — ฟีดข่าว",
  description: "รวมข่าวอาชญากรรมจากสำนักข่าวไทยและต่างประเทศ อัปเดตทุก 5 นาที",
  robots: { index: false, follow: false },
  openGraph: { title: "อาชญากรรม — ฟีดข่าว", type: "website" }
};

export const viewport = {
  themeColor: "#fafaf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
