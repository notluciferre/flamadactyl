import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/sections/navbar/navbar";
import Items from "@/components/sections/items/default";
import TypingText from "@/components/ui/typing-text";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar 
        name="CakraNode"
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
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            
            <h1 className="font-extrabold text-2xl md:text-2xl lg:text-6xl leading-tight">
            <span  className="text-foreground">Helping you make</span>{" "}
            <TypingText
                as="span"
                text={["Powerful", "Effective"]}
                typingSpeed={80}
                pauseDuration={1200}
                className="font-extrabold tracking-tight"
            />{" "}
            <p className="text-primary">Bots</p>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-foreground">
                  Schedule A Demo
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Watch Video
              </Button>
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div className="relative">
            <div className="relative">
              <div className="bg-card rounded-lg shadow-2xl p-6 space-y-4">
                {/* Terminal-like visualization */}
                <div className="flex items-center gap-2 pb-3 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">cakranode-terminal</span>
                </div>
                
                <div className="font-mono text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">$</span>
                    <span className="text-foreground">npm install cakranode-cli</span>
                  </div>
                  <div className="text-muted-foreground">Installing packages...</div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Bot deployed successfully!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">ℹ</span>
                    <span>Status: Running (99.9% uptime)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">●</span>
                    <span>Memory: 256MB / 512MB</span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold">99.9%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold">&lt;50ms</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
            </div>
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