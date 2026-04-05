import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function Legal() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground py-20 px-6 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-foreground mb-16 uppercase tracking-widest text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to Hub
        </Link>
        
        <div className="flex items-center gap-4 mb-12">
          <Scale className="w-8 h-8 text-accent" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight uppercase">
            Legal Directory
          </h1>
        </div>

        <div className="space-y-16 mt-16 animate-fade-in">
          
          <section className="border border-zinc-900 p-8 md:p-12 bg-zinc-900/10">
            <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-300 mb-6 border-b border-zinc-800 pb-4">Terms of Service</h2>
            <div className="space-y-4 text-sm text-zinc-400 font-light leading-relaxed">
              <p>By accessing Prophet AI, you agree to submit to the systemic analysis presented within the dashboard. Access to premium tiers is strictly non-refundable and final.</p>
              <p>The information provided through any of our access tiers (Toss, Match, or Agent Chat) is proprietary and protected by copyright. Redistribution of any insights or deterministic data is strictly prohibited and violates our core terms.</p>
            </div>
          </section>

          <section className="border border-zinc-900 p-8 md:p-12 bg-zinc-900/10">
            <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-300 mb-6 border-b border-zinc-800 pb-4">Privacy Policy</h2>
            <div className="space-y-4 text-sm text-zinc-400 font-light leading-relaxed">
              <p>Your authentication keys and session states are securely tracked. We only collect essential identifying metadata (Name, Email) to ensure the proper routing of your probabilistic insights.</p>
              <p>Payment information is processed securely through Razorpay matrix endpoints and is never stored on our local shards.</p>
            </div>
          </section>

          <section className="border border-red-900/30 p-8 md:p-12 bg-red-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/20 translate-x-8 -translate-y-8 rotate-45"></div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-accent mb-6 border-b border-red-900/30 pb-4">Liability Disclaimer</h2>
            <div className="space-y-4 text-sm text-zinc-400 font-light leading-relaxed">
              <p className="text-zinc-300">Prophet AI exists entirely for <strong className="text-accent">entertainment purposes</strong>.</p>
              <p>We do not guarantee the outcomes of any sporting events. Cricket variables are highly volatile due to nature, pitch micro-climates, and human performance anomalies. All predictions, odds calculation, and outcome algorithms supplied by this service are speculative theories and not financial advice.</p>
              <p>Prophet AI will never solicit you to make investments, bets, or wagers based on our data. The Oracle is not responsible for any financial loss, damages, or emotional distress resulting from relying on the generated outcomes or match results.</p>
              
              <div className="pt-8 mt-8 border-t border-red-900/10">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono italic">
                  Systems addendum section 8B: AI can make mistakes. The predictive analytics models are subject to systemic hallucinations and variance errors. The user acknowledges that logic nodes are fallible. No algorithm is God.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
