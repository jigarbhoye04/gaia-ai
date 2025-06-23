import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, useState } from "react";

import { OnboardingBackground } from "@/features/onboarding/components/OnboardingBackground";

import GetStartedButton from "../../shared/GetStartedButton";

export default function Description() {
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lastParagraphVisible, setLastParagraphVisible] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  const paragraphs = [
    "We believe that everyone deserves a personal assistant. Not just a chatbot — but something smarter.",
    "One that truly understands you, remembers what matters, and gets real work done.",
    "Frustrated with Siri, Alexa, ChatGPT or Google Assistant doing the bare minimum?",
    "What if everything in your digital life was seamlessly managed by an assistant that works like a real human, thinks ahead, and grows smarter the more you use it?",
    "Meet GAIA — your very own personal AI assistant. Something closer to Jarvis than any chatbot you've used.",
    "An AI that thinks, plans, and acts like a real human assistant would",
    "Because staying productive shouldn't require effort. It should feel effortless.",
  ];

  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // Make sure we have the DOM elements before animating
    if (
      textRefs.current.filter(Boolean).length === 0 ||
      !containerRef.current ||
      !sectionRef.current
    )
      return;

    // Setup intersection observer to track when the section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Clear any existing ScrollTriggers to prevent duplicates on re-renders
    ScrollTrigger.getAll().forEach((st) => st.kill());

    // Create text splits for word animation
    const newSplitTexts = textRefs.current.map((textRef) => {
      if (!textRef) return null;
      // Split text into words for staggered animation
      return new SplitText(textRef, { type: "words" });
    });

    // Set up the overall scrolling effect
    const totalHeight = sectionRef.current.offsetHeight;
    const sectionHeight = totalHeight / paragraphs.length;

    // Create a timeline for each text element
    textRefs.current.forEach((textRef, index) => {
      if (!textRef) return;

      // Initial state - fully transparent and blurred
      gsap.set(textRef, {
        opacity: 0,
        filter: "blur(8px)",
        position: "fixed",
        top: "47%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        // width: "80%",
        // maxWidth: "80rem",
        zIndex: 10,
      });

      // Create animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: `top+=${index * sectionHeight} center`,
          end: `top+=${(index + 1) * sectionHeight} top+=100`,
          scrub: 1, // Smoother transitions
          markers: false,
          toggleActions: "play none none reverse",
          onEnter: () => {
            // Ensure all other texts are hidden
            textRefs.current.forEach((ref, i) => {
              if (i !== index && ref) {
                gsap.to(ref, {
                  opacity: 0,
                  filter: "blur(20px)",
                  duration: 0.5, // Smoother transitions
                });
              }
            });

            // For paragraphs other than the last one, hide the button
            if (index !== paragraphs.length - 1) {
              setLastParagraphVisible(false);
            }
          },
        },
      });

      // Fade in and remove blur as the text enters the viewport
      tl.to(
        textRef,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 10, // Longer visibility
          ease: "power2.out",
        },
        0,
      );

      // Staggered animation for each word if split text is available
      if (newSplitTexts[index] && newSplitTexts[index].words) {
        tl.fromTo(
          newSplitTexts[index].words,
          {
            opacity: 0,
            y: 40,
            filter: "blur(10px)",
          },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 5,
            stagger: 0.7, // Stagger each word
            ease: "back.out(1.2)",
            onComplete: () => {
              // Only set the last paragraph as visible after all words have appeared
              if (index === paragraphs.length - 1) {
                setLastParagraphVisible(true);
              }
            },
          },
          0.5, // Slight delay after parent text starts to appear
        );
      }

      // Fade out and add blur as the text leaves the viewport - but only after
      // the text has been fully visible for a while
      tl.to(
        textRef,
        {
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.8,
        },
        20.0, // Increased delay - text stays visible much longer
      );
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (sectionRef.current) {
        observer.disconnect();
      }
    };
  }, [paragraphs.length]);

  return (
    <div
      ref={sectionRef}
      className="relative mb-60 flex flex-col items-center justify-center p-20"
      style={{
        height: `${paragraphs.length * 100}vh`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className={`fixed inset-0 z-[-1] h-screen w-full transition-opacity duration-700 ${
          isSectionVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <OnboardingBackground />
      </div>

      <div ref={containerRef} className="relative z-10 w-full max-w-4xl">
        {paragraphs.map((text, index) => (
          <div
            key={index}
            ref={(el) => {
              textRefs.current[index] = el;
            }}
            className="max-w-3xl text-center text-6xl font-medium"
            style={{ width: "100%" }}
          >
            {text}
            {index === paragraphs.length - 1 && (
              <div
                className={`mt-12 transition-opacity duration-500 ${
                  lastParagraphVisible
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <GetStartedButton text="Sign Up" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
