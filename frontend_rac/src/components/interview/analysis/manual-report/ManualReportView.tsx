"use client";
import { EditableReport } from "./EditableReport";
import { ManualReportStakeholderDisplay } from "./ManualReportStakeholderDisplay";

export function ManualReportView() {
  return (
    <div className="grid grid-cols-2 gap-8">
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
