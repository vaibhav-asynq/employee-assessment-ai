"use client";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { EditableReport } from "./EditableReport";
import { Loader2 } from "lucide-react";
import { ManualReportStakeholderDisplay } from "../manual-report/ManualReportStakeholderDisplay";

export function FullReportView() {
  const loading = useInterviewDataStore((state) => state.loading);

  if (loading) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 h-[calc(100vh-120px)]">
      <div className="overflow-y-auto pr-4 p-6">
        <div className="mt-4 mb-6">
          <h2 className="text-2xl font-bold">Sorted by stakeholder</h2>
        </div>
        <ManualReportStakeholderDisplay />
      </div>
      <div className="border-l pl-8 overflow-y-auto p-6">
        <EditableReport />
      </div>
    </div>
  );
}
