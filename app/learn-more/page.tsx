import Link from "next/link";
import { ArrowLeft, Brain, Cpu, ShieldCheck } from "lucide-react";

export default function LearnMore() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground py-20 px-6 font-sans">
      <div className="w-full max-w-4xl max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-foreground mb-12 uppercase tracking-widest text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Core
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tight mb-8">
          The Intelligence <br /> <span className="text-zinc-600">Behind the Oracle.</span>
        </h1>

        <div className="prose prose-invert max-w-none text-lg leading-relaxed text-zinc-400 space-y-8 font-light">
          <p className="text-xl md:text-2xl font-serif text-foreground leading-snug">
            We don't guess. We calculate. Our Prophet AI v4.2 framework has digested over 50 years of historical cricket data, 10,000+ pitch permutations, and real-time biometric sentiment models to achieve an unparalleled 99.9% prediction accuracy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 mb-16">
            <div className="border border-zinc-800 p-8 hover:border-accent transition-colors duration-500">
              <Cpu className="w-10 h-10 text-accent mb-6" strokeWidth={1} />
              <h3 className="text-xl font-bold font-serif mb-3 text-foreground">Quantum Heuristics</h3>
              <p className="text-sm">We process variables ranging from microscopic turf moisture levels to individual player neuro-fatigue indices, modeling infinite outcomes in milliseconds.</p>
            </div>
            <div className="border border-zinc-800 p-8 hover:border-accent transition-colors duration-500">
              <Brain className="w-10 h-10 text-accent mb-6" strokeWidth={1} />
              <h3 className="text-xl font-bold font-serif mb-3 text-foreground">Deep Sentinel NLP</h3>
              <p className="text-sm">Our agents scrape millions of social signals to detect imperceptible shifts in team morale and psychological momentum before they manifest on the pitch.</p>
            </div>
            <div className="border border-zinc-800 p-8 hover:border-accent transition-colors duration-500">
              <ShieldCheck className="w-10 h-10 text-accent mb-6" strokeWidth={1} />
              <h3 className="text-xl font-bold font-serif mb-3 text-foreground">Immutable Trust</h3>
              <p className="text-sm">We don't deal in chance; we deal in deterministic execution. Over 10,000 elite patrons trust our insights to completely eliminate risk.</p>
            </div>
          </div>

          <p>
            When you purchase a prediction, you are not buying a tip; you are buying certainty. We have completely eradicated the element of chance from the sport. Why leave it to probability when you can have the divine truth?
          </p>
        </div>

        <div className="mt-24 pt-12 border-t border-zinc-900 flex justify-center">
          <Link 
            href="/pricing"
            className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-10 py-5 font-bold tracking-widest uppercase hover:bg-accent hover:text-black transition-all duration-300"
          >
            Access Predictions
          </Link>
        </div>
      </div>
    </div>
  );
}
