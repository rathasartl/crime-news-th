import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, IBM_Plex_Serif, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";

const sansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-sans"
});

const serifLatin = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-ibm-serif"
});

const serifThai = Noto_Serif_Thai({
  subsets: ["thai"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-serif-thai"
});

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
    <html
      lang="th"
      className={`${sansThai.variable} ${serifLatin.variable} ${serifThai.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
