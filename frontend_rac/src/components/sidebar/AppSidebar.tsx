import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TaskHistory } from "./tasks/TaskHistory";

export function AppSidebar() {
  return (
    <div className="">
      <div>
        <Sidebar variant="inset" className="z-50 ">
          <div className="absolute top-4 -right-10">
            <SidebarTrigger />
          </div>
          <SidebarContent>
            {/* Task History Section */}
            <TaskHistory />
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>
      </div>
    </div>
  );
}
