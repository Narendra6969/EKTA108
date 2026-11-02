
'use server';
/**
 * @fileOverview Provides AI-generated first aid advice based on accident details,
 * optionally including analysis of an uploaded photo and a relevant instructional video.
 *
 * - getTriageAdvice - A function that generates first aid advice.
 * - TriageAdviceInput - The input type for the getTriageAdvice function.
 * - TriageAdviceOutput - The return type for the getTriageAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TriageAdviceInputSchema = z.object({
  accidentDetails: z
    .string()
    .describe('Detailed description of the accident, including potential injuries and environment.'),
  streetAddress: z.string().optional().describe('The street address of the accident location, if known.'),
  latitude: z.number().optional().describe('The latitude of the accident location, if known.'),
  longitude: z.number().optional().describe('The longitude of the accident location, if known.'),
  photoDataUri: z
    .string()
 .nullable()
    .optional()
    .describe(
      "An optional photo of the accident scene or affected person(s), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TriageAdviceInput = z.infer<typeof TriageAdviceInputSchema>;

const TriageAdviceOutputSchema = z.object({
  advice: z.string().describe('AI-generated first aid and safety advice, potentially incorporating photo analysis of the scene and any affected individuals.'),
  youtubeVideoUrl: z.string().url().optional().nullable().describe("A relevant YouTube URL demonstrating the primary first aid advice. The video should be from a reputable source like Red Cross, St John Ambulance, or a certified medical institution. The URL should be for embedding (e.g., 'https://www.youtube.com/embed/VIDEO_ID')."),
});
export type TriageAdviceOutput = z.infer<typeof TriageAdviceOutputSchema>;

export async function getTriageAdvice(input: TriageAdviceInput): Promise<TriageAdviceOutput> {
  return triageAdviceFlow(input);
}

const triageAdvicePrompt = ai.definePrompt({
  name: 'triageAdvicePrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: {schema: TriageAdviceInputSchema},
  output: {schema: TriageAdviceOutputSchema},
  prompt: `You are an AI assistant providing first aid advice based on accident details.

  Given the following accident details, provide tailored first aid and safety advice.
  
  Location information (if available):
  {{#if latitude}}Coordinates: Latitude {{{latitude}}}, Longitude {{{longitude}}}{{/if}}
  {{#if streetAddress}}Street Address: {{{streetAddress}}}{{/if}}
  {{#unless latitude}}{{#unless streetAddress}}No specific location provided.{{/unless}}{{/unless}}

  Accident Details (Textual Description): {{{accidentDetails}}}

  {{#if photoDataUri}}
  An image of the accident scene or affected person(s) has been provided:
  {{media url=photoDataUri}}
  
  **Crucially, you must carefully analyze this image AND cross-reference it with the textual "Accident Details" provided above.**
  - Your advice should be based on an integrated understanding of BOTH the textual description AND the visual information from the photo.
  {{else}}
  No photo was provided. Base your advice solely on the textual "Accident Details" and any location information.
  {{/if}}

  **Main Task:**
  1.  **Provide Advice:** Generate clear, actionable steps for first aid and safety based on all available information.
  2.  **Find a Video:** Based on your primary advice, find a relevant instructional YouTube video from a reputable source (e.g., Red Cross, St John Ambulance, a major hospital or certified medical training channel). 
  3.  **Set the URL:** Set the 'youtubeVideoUrl' field in your response to the embeddable URL of this video (e.g., "https://www.youtube.com/embed/VIDEO_ID"). If no suitable, high-quality video is found, return null for this field.

  Return ONLY the JSON object with 'advice' and 'youtubeVideoUrl'.
  `,
});

const triageAdviceFlow = ai.defineFlow(
  {
    name: 'triageAdviceFlow',
    inputSchema: TriageAdviceInputSchema,
    outputSchema: TriageAdviceOutputSchema,
  },
  async input => {
    // Log the input being sent to the AI model for debugging, especially the photoDataUri
    // console.log('Sending to AI model:', {
    //   ...input,
    //   photoDataUri: input.photoDataUri ? input.photoDataUri.substring(0, 100) + '...' : 'Not provided', // Log only a snippet
    // });

    const {output} = await triageAdvicePrompt(input);
    if (!output) {
      throw new Error("The AI model did not return any output. Please try again.");
    }
    return output;
  }
);
