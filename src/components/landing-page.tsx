import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/sections/navbar/navbar";
import Items from "@/components/sections/items/default";
import TypingText from "@/components/ui/typing-text";
import { Safari } from "./ui/safari";

export function LandingPage() {
  // Image original dimensions
  const imgW = 1914
  const imgH = 876
  const imgRatio = imgW / imgH

  // Safari SVG base dimensions (must match values in Safari component)
  const BASE_WIDTH = 1203
  const BASE_HEIGHT = 753

  // Adjustment factor to account for the Safari chrome area (top 52px and 2px horizontal padding)
  const A = ((BASE_WIDTH - 2) / BASE_WIDTH) * (BASE_HEIGHT / (BASE_HEIGHT - 52))
  const adjustedAspect = imgRatio / A

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar 
        name="Flamahost"
        homeUrl="/"
        showNavigation={false}
        mobileLinks={[
          { text: "Features", href: "#features" },
          { text: "Pricing", href: "#pricing" },
          { text: "Docs", href: "#docs" },
        ]}
        actions={[
          { text: "Login", href: "/login", isButton: false },
          { text: "Get Started", href: "/register", isButton: true, variant: "default" },
        ]}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        <div className="flex flex-col items-center gap-8 lg:gap-12 text-center">
          <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
            
            <h1 className="font-extrabold text-4xl sm:text-5xl md:text-5xl lg:text-6xl leading-tight">
            <span  className="text-foreground">Helping you make</span>{" "}
            <br/>
            <TypingText
                as="span"
                text={["Powerful", "Effective"]}
                typingSpeed={80}
                pauseDuration={1200}
                className="font-extrabold tracking-tight"
                suppressHydrationWarning
            />{" "}
            <span className="text-primary">Bots</span>
            </h1>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-foreground">
                  Get Started
                </Button>
              </Link>
              <a href="https://t.me/lucifereous64">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Contact Admin
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div
            className="relative w-full mt-4 max-w-[1200px] mx-auto"
            style={{ aspectRatio: `${adjustedAspect} / 1` }}
          >
            <Safari
              className="rounded-lg shadow-lg"
              width="100%"
              height="100%"
              imageSrc="/images/botnetpage.png"
              url="https://flamahost.com/dashboard"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <Items />
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CakraNode. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}