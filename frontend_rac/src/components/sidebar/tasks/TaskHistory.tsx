"use client";

import { getFileTaskHistory } from "@/lib/api";
import { Task } from "@/lib/types/types.filetask";
import { FileText, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
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

export function TaskHistory() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { fileId, setFileId } = useInterviewDataStore();

  useEffect(() => {
    const fetchTasks = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const tasksData = await getFileTaskHistory(user.id);
          setTasks(tasksData);
        } catch (error) {
          console.error("Error fetching task history:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTasks();
  }, [user?.id]);

  const handleTaskClick = (fileId: string | null) => {
    setFileId(fileId);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Task History</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex gap-3 items-center text-center"
              onClick={() => handleTaskClick(null)}
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
                  onClick={() => handleTaskClick(task.file_id)}
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
