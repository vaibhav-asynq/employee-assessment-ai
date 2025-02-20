import { Home, FileText, Settings } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r h-full">
      <nav className="p-4 space-y-2">
        <a
          href="/"
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </a>
        <a
          href="/interview"
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
        >
          <FileText className="h-5 w-5" />
          <span>Analysis</span>
        </a>
        <a
          href="/settings"
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </a>
      </nav>
    </aside>
  );
}

