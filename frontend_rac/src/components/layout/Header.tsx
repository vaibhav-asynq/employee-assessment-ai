import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Interview Analysis Tool</h1>
        <nav className="space-x-4">
          <Button variant="ghost">Dashboard</Button>
          <Button variant="ghost">History</Button>
          <Button variant="ghost">Settings</Button>
        </nav>
      </div>
    </header>
  );
}