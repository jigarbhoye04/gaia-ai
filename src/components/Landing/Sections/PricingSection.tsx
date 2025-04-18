import { PricingCard } from "@/components/Pricing/PricingCard";

export default function FreePricing() {
  return (
    <div className="relative flex min-h-fit w-screen flex-col items-center justify-center gap-2">
      <div className="mb-6">
        <div className="text-center text-5xl font-medium">GAIA is FREE!</div>
        <div className="px-5 text-center text-lg font-normal text-foreground-700">
          Unlock limitless AI-powered possibilities without spending anything.
        </div>
      </div>

      {/* <div className="absolute inset-0 flex items-center justify-center h-full w-full">
        <img
          alt="Sphere background"
          className="h-full sm:max-w-[50vw] object-contain sm:top-[40vh] top-[10vh] relative filter z-[-1]"
          src="landing/sphere.webp"
        />
      </div> */}
      <div className="relative flex w-full max-w-(--breakpoint-lg) justify-center">
        {/* <div className="w-[300px]"> */}
        <PricingCard
          className="rounded-2xl bg-zinc-900! !bg-opacity-[100%] backdrop-blur-none!"
          durationIsMonth={true}
          features={["Feature 1", "Feature 2", "Feature 3", "Feature 4"]}
          featurestitle={
            <div className="mb-1 flex flex-col border-none!">
              <span>What's Included?</span>
            </div>
          }
          price={0}
          title="Free"
          type="secondary"
        />
        {/* </div> */}
      </div>
    </div>
  );
}
