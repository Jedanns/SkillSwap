import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import DemoPortal from "@/components/landing/demo/demo-portal";
import { BentoGrid } from "@/components/landing/bento-grid";
import { FeatureRows } from "@/components/landing/feature-rows";
import { SocialProof } from "@/components/landing/social-proof";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  // Landing is intentionally light-only: it sets brand canvas/ink directly and
  // doesn't rely on the .dark theme, per the design brief.
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DemoPortal />
        <BentoGrid />
        <FeatureRows />
        <SocialProof />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
