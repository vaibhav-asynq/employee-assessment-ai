"use client";
import { InterviewAnalysis } from "@/components/interview/InterviewAnalysis";
// import { AppSidebar } from "@/components/sidebar/AppSidebar";
// import { SidebarTrigger } from "@/components/ui/sidebar";

export default function HomePage() {
  return (
    <div className="relative container mx-auto px-4 py-8">
      {/* <AppSidebar /> */}
      <main>
        {/* <SidebarTrigger /> */}
        <InterviewAnalysis />
      </main>
    </div>
  );
}
