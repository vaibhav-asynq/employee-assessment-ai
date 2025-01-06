// src/components/layout/Footer.tsx
export function Footer() {
    return (
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Interview Analysis Tool. All rights reserved.
        </div>
      </footer>
    );
  }