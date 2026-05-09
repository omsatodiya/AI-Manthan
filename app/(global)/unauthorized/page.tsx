import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-full">
            <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold font-serif text-foreground">
            Access Restricted
          </h1>
          <p className="text-muted-foreground text-lg">
            You don&apos;t have an active membership for this community.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="w-full h-14 text-lg">
            <Link href="/community" className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Explore Communities
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full h-14 text-lg">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Return to Lobby
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground pt-8 border-t">
          Want to join this community? Visit the platform lobby to submit an application.
        </p>
      </div>
    </main>
  );
}
