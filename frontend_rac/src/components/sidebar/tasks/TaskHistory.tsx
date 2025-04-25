"use client";

import { FileText, Plus } from "lucide-react";
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
import { useStepper } from "@/components/ui/stepper";

export function TaskHistory() {
  const { user } = useUser();
  const { fileId, setFileId, setFeedbackData, setAdviceData } =
    useInterviewDataStore();
  const { loadSnapshot } = useSnapshotLoader(null, false);
  const { goToStep } = useStepper();

  const { data: tasks = [], isLoading: isTasksLoading } = useTaskHistory(
    user?.id,
  );

  const loading = isTasksLoading;

  const handleTaskClick = async (
    file_id: string | null,
    snapShotId?: number,
  ) => {
    setFileId(null);
    if (file_id === null) {
      setFileId(file_id);
      return;
    }
    setFileId(file_id);
    try {
      // INFO: dont need this here, just setting the proper file Id will move to next screen and will handle the work
      await loadSnapshot(snapShotId);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Task History</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex gap-3 items-center text-center"
              onClick={() => {
                handleTaskClick(null);
                setFeedbackData(null);
                setAdviceData(null);
                goToStep(1);
              }}
              isActive={!fileId}
            >
              <Plus size={14} />
              <span>New Task</span>
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
                >
                  <FileText />
                  <span className="flex flex-col">
                    <span className="truncate">{task.file_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.name}
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
