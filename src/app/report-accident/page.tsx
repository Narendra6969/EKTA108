
import AccidentReportForm from "@/components/forms/AccidentReportForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportAccidentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="py-4">
        <div className="container mx-auto px-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 pb-8 md:pb-12 pt-4 md:pt-0">
        <div className="container mx-auto px-4">
          <AccidentReportForm />
        </div>
      </main>
    </div>
  );
}
