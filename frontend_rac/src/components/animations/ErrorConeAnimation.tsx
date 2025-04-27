"use client";

import lottieErrorAnimation from "@/../public/lottie/error-cone.json";
import { cn } from "@/lib/utils";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { useRef } from "react";

export function ErrorConeAnimation({ className = "" }: { className?: string }) {
  const animationRef = useRef<LottieRefCurrentProps>(null);
  return (
    <div className={cn("max-w-[200px]", className)}>
      <Lottie
        loop={false}
        onComplete={() => {
          animationRef.current?.goToAndPlay(52, true);
        }}
        animationData={lottieErrorAnimation}
        lottieRef={animationRef}
      />
    </div>
  );
}
