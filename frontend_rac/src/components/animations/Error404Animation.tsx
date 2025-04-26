"use client";

import lottieErrorAnimation from "@/../public/lottie/error-404.json";
import { cn } from "@/lib/utils";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { useRef } from "react";

export function Error404Animation({ className = "" }: { className?: string }) {
  const animationRef = useRef<LottieRefCurrentProps>(null);
  return (
    <div className={cn("max-w-[200px]", className)}>
      <Lottie
        loop={true}
        animationData={lottieErrorAnimation}
        lottieRef={animationRef}
      />
    </div>
  );
}
