import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-20 z-40 flex w-full items-center border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm md:px-6">
        <Link href="/templates" className="inline-flex">
          <Button variant="outline" className="gap-2 font-sans">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Templates
          </Button>
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
