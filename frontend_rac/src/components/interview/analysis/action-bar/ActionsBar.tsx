import { cn } from "@/lib/utils";
import { GenerateFullReport } from "./GenerateFullReport";
import { GenerateCompetencies } from "./GenerateCompetencies";
import { ResetTemplate } from "./ResetTemplate";

function ActionsBar() {
  return (
    <div className="flex justify-between items-center">
      <div className={cn("flex gap-10")}>
        <GenerateFullReport />
        <GenerateCompetencies />
      </div>
      <div>
        <ResetTemplate />
      </div>
    </div>
  );
}

export default ActionsBar;
