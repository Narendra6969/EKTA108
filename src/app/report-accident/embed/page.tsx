
import AccidentReportForm from "@/components/forms/AccidentReportForm";

// This page is designed to be embedded in an iframe.
// It uses a minimal layout (embed/layout.tsx) that has no header or footer.
export default function ReportAccidentEmbedPage() {
  return (
    <div className="p-2 md:p-4 bg-background">
      <AccidentReportForm />
    </div>
  );
}
