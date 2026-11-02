
"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Sparkles } from "lucide-react";
import { generateVideo } from "@/ai/flows/generate-video-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GenerateVideoPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please enter a description for the video you want to generate.",
      });
      return;
    }

    setIsLoading(true);
    setVideoDataUri(null);
    setError(null);

    try {
      const result = await generateVideo({ prompt });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.videoDataUri) {
        setVideoDataUri(result.videoDataUri);
        toast({
          title: "Video Generated Successfully",
          description: "Your video has been created by the AI.",
        });
      } else {
        throw new Error("The AI flow did not return a video.");
      }
    } catch (err) {
      console.error("Video generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video generation.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Video Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Video Generation</h1>
      <DashboardCard
        title="Text-to-Video with Veo"
        icon={<Video className="h-6 w-6" />}
        description="Describe a scene, and the AI will generate a short video based on your prompt. This process can take up to a minute."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            id="prompt"
            placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video (this may take a minute)...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </form>

        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {videoDataUri && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Generated Video:</h3>
            <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
              <video
                src={videoDataUri}
                controls
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

export default GenerateVideoPage;
