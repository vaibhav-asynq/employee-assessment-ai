"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";

export function TabsComponent() {
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const availablePaths = useUserPreferencesStore(
    (state) => state.availablePaths,
  );
  const setSelectedPath = useUserPreferencesStore(
    (state) => state.setSelectedPath,
  );

  return (
    <div className="flex items-center">
      <TabsList>
        {availablePaths.map((path) => {
          return (
            <TabsTrigger
              className={cn("data-[state=active]:text-black  rounded-none")}
              key={path.id}
              value={path.id}
              onClick={() => {
                if (!selectedPath.includes(path.id)) {
                  setSelectedPath(path.id);
                }
              }}
            >
              <div className="">{path.name}</div>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}
