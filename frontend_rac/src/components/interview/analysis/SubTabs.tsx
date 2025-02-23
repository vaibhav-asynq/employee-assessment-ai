"use client";
import { useEffect, useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChildPath, SelectPathIds } from "@/lib/types/types.user-preferences";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { cn } from "@/lib/utils";

interface Props {
  parentTabId: SelectPathIds;
}
export function SubTabs({ parentTabId }: Props) {
  const getChildTabs = useUserPreferencesStore((state) => state.getChildTabs);
  const avilablePaths = useUserPreferencesStore(
    (state) => state.availablePaths,
  );
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const setSelectedPath = useUserPreferencesStore(
    (state) => state.setSelectedPath,
  );

  const [availableTabs, setAvailableTabs] = useState<ChildPath[]>([]);

  useEffect(() => {
    setAvailableTabs(getChildTabs(parentTabId));
  }, [getChildTabs, parentTabId, selectedPath, avilablePaths.length]);

  return (
    <div
      className={cn(
        "bg-background shadow",
        "pb-2",
        "flex flex-col gap-6 justify-between ",
      )}
    >
      <div className={cn("flex items-center justify-between ")}>
        <div className="flex items-center">
          <TabsList>
            {availableTabs.map((path) => {
              return (
                <TabsTrigger
                  key={path.id}
                  value={path.id}
                  onClick={() => {
                    setSelectedPath(parentTabId, path.id);
                  }}
                >
                  {path.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>
    </div>
  );
}
