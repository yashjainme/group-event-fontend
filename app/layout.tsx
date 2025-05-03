import type { Metadata } from "next";
// Removed Geist font imports as the app uses Tailwind's default font-sans
import "./globals.css"; // Keep this for Tailwind CSS

// Updated metadata for the Group Event Planner app
export const metadata: Metadata = {
  title: "Group Event Planner",
  description: "Plan and coordinate group events easily with an interactive calendar.",
  // Optional: Add more metadata like icons, open graph tags, etc.
  // icons: {
  //   icon: "/favicon.ico", // Example path
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
       * Removed Geist font variables from className.
       * Tailwind applies the default sans-serif font stack via globals.css.
       * 'antialiased' improves font rendering.
       */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
