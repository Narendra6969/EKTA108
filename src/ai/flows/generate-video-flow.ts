
'use server';
/**
 * @fileOverview Generates a video from a text prompt using the Veo model.
 *
 * - generateVideo - A function that handles the video generation process.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import {MediaPart} from 'genkit/model';
import {Readable} from 'stream';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text description of the video to generate.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().optional().describe('The generated video as a data URI.'),
  error: z.string().optional(),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

// Helper to download video content and convert to base64 data URI
async function streamToBase64(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
  });
}

async function downloadAndEncodeVideo(video: MediaPart): Promise<string> {
  // Use dynamic import for node-fetch
  const fetch = (await import('node-fetch')).default;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set in the environment variables.'
    );
  }

  const videoDownloadUrl = `${video.media!.url}&key=${apiKey}`;
  const videoDownloadResponse = await fetch(videoDownloadUrl);

  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error(
      `Failed to download video. Status: ${videoDownloadResponse.status}`
    );
  }

  const base64Data = await streamToBase64(
    Readable.from(videoDownloadResponse.body)
  );
  return `data:video/mp4;base64,${base64Data}`;
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({prompt}) => {
    console.log(`[Flow] Starting video generation for prompt: "${prompt}"`);

    try {
      let {operation} = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });

      if (!operation) {
        throw new Error('Expected the model to return an operation.');
      }

      console.log('[Flow] Video generation operation started. Polling for completion...');

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        operation = await ai.checkOperation(operation);
        console.log(`[Flow] Polling... Operation status: ${operation.done ? 'Done' : 'In Progress'}`);
      }

      if (operation.error) {
        throw new Error(
          `Video generation failed: ${operation.error.message}`
        );
      }

      const video = operation.output?.message?.content.find(p => !!p.media);
      if (!video) {
        throw new Error('Failed to find the generated video in the operation output.');
      }

      console.log('[Flow] Video generation complete. Downloading and encoding...');
      const videoDataUri = await downloadAndEncodeVideo(video);
      console.log('[Flow] Video successfully encoded to data URI.');
      
      return { videoDataUri };

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('[Flow] Error in generateVideoFlow:', error);
      return {error: errorMessage};
    }
  }
);
