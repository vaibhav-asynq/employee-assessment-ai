"use client";

import { FileText, Plus, Clock, Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { useTaskHistory } from "@/lib/react-query";
import { format } from "date-fns";

export function TaskHistory() {
  const { user } = useUser();
  const { fileId, setFileId } = useInterviewDataStore();
  const { loadSnapshot } = useSnapshotLoader(null, false);

  const { data: tasks = [], isLoading: isTasksLoading } = useTaskHistory(
    user?.id,
  );

  const loading = isTasksLoading;

  // Function to format date - using current date as fallback
  const formatDate = () => {
    try {
      return format(new Date(), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Unknown date";
    }
  };

  const handleTaskClick = (
    file_id: string | null,
    snapShotId?: number,
  ) => {
    if (file_id === null) {
      setFileId(file_id);
      return;
    }
    setFileId(file_id);

    // Use Promise-based approach instead of await
    if (snapShotId) {
      loadSnapshot(snapShotId).catch(e => {
        console.log(e);
      });
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-semibold">Task History</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex gap-3 items-center text-center bg-blue-50 hover:bg-blue-100"
              onClick={() => handleTaskClick(null)}
              isActive={!fileId}
            >
              <Plus size={14} className="text-blue-600" />
              <span className="font-medium">New Task</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {loading ? (
            // Show skeletons while loading
            Array.from({ length: 5 }).map((_, index) => (
              <SidebarMenuSkeleton key={index} showIcon={true} />
            ))
          ) : tasks && tasks.length > 0 ? (
            // Show tasks if available
            tasks.map((task) => (
              <SidebarMenuItem key={task.id}>
                <SidebarMenuButton
                  onClick={() =>
                    handleTaskClick(task.file_id, task.current_snapshot_id)
                  }
                  tooltip={task.file_name}
                  isActive={task.file_id === fileId}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <FileText className="text-gray-600" />
                    <span className="flex flex-col w-full overflow-hidden max-w-[200px]">
                      <span className="truncate font-medium">{task.file_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Calendar size={10} />
                        <span className="truncate">{formatDate()}</span>
                      </span>
                    </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            // Show message if no tasks
            <div className="px-2 py-4 text-sm text-muted-foreground">
              No tasks found. Upload a file to get started.
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
