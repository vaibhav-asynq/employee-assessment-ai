// src/app/layout.tsx
import { Providers } from "../components/providers";
import "./globals.css";

export const metadata = {
  title: 'RAC AI 360',
  description: 'Interview analysis and assessment tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
