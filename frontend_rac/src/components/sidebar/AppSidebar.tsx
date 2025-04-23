import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { TaskHistory } from "./tasks/TaskHistory";

export function AppSidebar() {
  return (
    <div className="">
      <Sidebar variant="floating">
        <SidebarContent>
          {/* Task History Section */}
          <TaskHistory />
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
    </div>
  );
}
