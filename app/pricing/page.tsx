"use client";

import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Check, Zap, Coins, UserCircle } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function PricingContent() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle auto-payment redirect from sign-in
  useEffect(() => {
    const checkAutoPay = async () => {
      const autoPayAmount = localStorage.getItem("pending_payment_amount");
      const autoPayTier = localStorage.getItem("pending_payment_tier");
      if (autoPayAmount && autoPayTier) {
        localStorage.removeItem("pending_payment_amount");
        localStorage.removeItem("pending_payment_tier");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          handlePayment(autoPayTier, parseInt(autoPayAmount));
        }
      }
    };
    checkAutoPay();
  }, []);

  const handlePayment = async (tierName: string, amount: number) => {
    setLoadingTier(tierName);
    
    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Save choice and go to login
      localStorage.setItem("pending_payment_amount", amount.toString());
      localStorage.setItem("pending_payment_tier", tierName);
      router.push("/sign-in");
      return;
    }

    try {
      // Create Razorpay Order
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      const orderData = await response.json();

      if (orderData.error) {
        throw new Error(orderData.error);
      }
      
      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "Oracle Predictions",
        description: `Premium Knowledge: ${tierName}`,
        order_id: orderData.id,
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        },
        theme: {
          color: "#d4af37",
        },
        handler: async function (response: any) {
          // Success callback
          // Update the user's tier in their metadata
          await supabase.auth.updateUser({
            data: { tier: tierName }
          });
          router.push("/prediction");
        },
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp1.open();

    } catch (err: any) {
      alert("Error initiating payment: " + err.message);
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers = [
    {
      name: "Toss Prediction",
      price: 5,
      icon: <Coins className="w-8 h-8 mb-4 text-accent" />,
      features: ["Coin Toss Outcome Only", "Delivered 10 mins before toss", "98.5% Accuracy"],
      popular: false,
    },
    {
      name: "Match Prediction",
      price: 25,
      icon: <Zap className="w-8 h-8 mb-4 text-accent fill-accent" />,
      features: ["Complete Match Winner", "Toss Outcome Included", "99.9% Accuracy guaranteed", "AI Reasoning Report"],
      popular: true,
    },
    {
      name: "Talk to Agent",
      price: 100,
      icon: <UserCircle className="w-8 h-8 mb-4 text-accent" />,
      features: ["Live Chat with Prophet AI", "In-play predictive analysis", "Unlimited questions (1 Match)"],
      popular: false,
    }
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground py-20 px-6 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-foreground mb-12 uppercase tracking-widest text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight mb-4 uppercase">
            Acquire Knowledge.
          </h1>
          <p className="text-xl text-zinc-400 font-light">
            Certainty comes at a price. Select your tier of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative flex flex-col border p-8 transition-colors duration-300 ${
                tier.popular 
                  ? "border-accent bg-accent/5 scale-100 md:scale-105 z-10 shadow-2xl shadow-accent/10" 
                  : "border-zinc-800 hover:border-zinc-500 bg-background z-0"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-accent text-black text-xs font-bold uppercase tracking-widest px-3 py-1 -mt-3 mr-3 shadow-lg">
                  Most Chosen
                </div>
              )}
              
              {tier.icon}
              <h2 className="text-2xl font-bold font-serif mb-2">{tier.name}</h2>
              <div className="flex items-baseline gap-1 mb-8 border-b border-zinc-800 pb-8">
                <span className="text-4xl font-bold text-foreground">₹{tier.price}</span>
                <span className="text-sm text-zinc-500 font-medium">/match</span>
              </div>
              
              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 font-light">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handlePayment(tier.name, tier.price)}
                disabled={loadingTier === tier.name}
                className={`w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex justify-center items-center gap-2 ${
                  tier.popular
                    ? "bg-foreground text-background hover:bg-accent hover:text-black"
                    : "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                {loadingTier === tier.name ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  "Initiate Payment"
                )}
              </button>
            </div>
          ))}
        </div>
        
        <p className="text-center mt-16 text-xs text-zinc-600 tracking-wider uppercase font-medium">
          Payments are securely encrypted and absolute.
        </p>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans"><div className="w-16 h-16 border-t-2 border-accent mb-8" style={{ borderRadius: 0 }}></div><p className="text-xs text-zinc-500 uppercase tracking-widest animate-pulse font-bold">Verifying Tiers...</p></div>}>
      <PricingContent />
    </Suspense>
  );
}
