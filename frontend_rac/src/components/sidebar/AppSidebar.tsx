import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TaskHistory } from "./tasks/TaskHistory";

export function AppSidebar() {
  return (
    <div className="max-w-[240px]">
      <div>
        <SidebarProvider>
          <Sidebar 
            variant="inset" 
            className="z-50 shadow-md border-r border-gray-200"
            style={{ "--sidebar-width": "240px" } as React.CSSProperties}
          >
            <div className="absolute top-4 -right-10">
              <SidebarTrigger />
            </div>
            <SidebarContent>
              {/* Task History Section */}
              <TaskHistory />
            </SidebarContent>
            <SidebarFooter />
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}
