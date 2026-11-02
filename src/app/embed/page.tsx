
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Code2 } from 'lucide-react';

const EmbedCodeDisplay = () => {
  // In a real app, you'd dynamically get the origin. For this environment,
  // we can construct a relative URL which is more robust.
  const embedUrl = `/report-accident/embed`;
  
  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="800px"
  style="border:none; max-width: 640px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  title="Report Accident Form - EKTA108"
></iframe>`;

  return (
    <div className="space-y-4">
      <Textarea
        readOnly
        value={embedCode}
        rows={8}
        className="w-full font-mono text-sm bg-muted/50"
      />
      <p className="text-xs text-muted-foreground">
        Note: The \`src\` attribute uses a relative path. If you embed this on a different domain, you will need to replace \`"/report-accident/embed"\` with the full URL of your deployed EKTA108 application (e.g., \`https://yourapp.com/report-accident/embed\`).
      </p>
    </div>
  );
};


export default function EmbedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Code2 className="h-6 w-6 text-primary" />
                Embed EKTA108 On Your Site
              </CardTitle>
              <CardDescription>
                Help your community by adding the EKTA108 accident reporting form directly to your website. Simply copy the code below and paste it into your HTML where you want the form to appear.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmbedCodeDisplay />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
