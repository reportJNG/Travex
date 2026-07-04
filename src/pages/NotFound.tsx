import { Link } from "react-router";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
          404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          This page does not exist or has moved. Head back to the marketplace or home page to continue.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <Home className="me-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  );
}
