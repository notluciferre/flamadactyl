import type { Metadata } from "next";
// import { Inter, IBM_Plex_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/components/ui/toast-notification"
import "./globals.css";

// Temporarily use system fonts to avoid Google Fonts fetch issues during build
// const inter = Inter({
//   subsets: ["latin"],
//   weight: ["800"],
//   variable: "--font-inter",
//   display: "swap",
//   fallback: ["system-ui", "arial"],
// })

// const ibmPlexMono = IBM_Plex_Mono({
//   subsets: ["latin"],
//   weight: ["400", "500", "600"],
//   variable: "--font-ibm",
//   display: "swap",
//   fallback: ["Courier New", "monospace"],
// })

export const metadata: Metadata = {
  title: "CakraNode - Powerful Bot Management",
  description: "Manage your Minecraft bots with ease",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
