
'use server';
/**
 * @fileOverview Provides reverse geocoding functionality (coordinates to address) using the OpenStreetMap Nominatim API as a primary source and a Genkit LLM prompt as a fallback.
 *
 * - geocodeCoordinatesToAddress - A function that converts latitude/longitude to a formatted address.
 * - GeocodeCoordinatesInput - The input type for the geocodeCoordinatesToAddress function.
 * - GeocodeCoordinatesOutput - The return type for the geocodeCoordinatesToAddress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeocodeCoordinatesInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
type GeocodeCoordinatesInput = z.infer<typeof GeocodeCoordinatesInputSchema>;

const GeocodeCoordinatesOutputSchema = z.object({
  formattedAddress: z.string().optional().describe('The most relevant formatted street address.'),
  error: z.string().optional().describe('An error message if geocoding failed.'),
});
type GeocodeCoordinatesOutput = z.infer<typeof GeocodeCoordinatesOutputSchema>;

export async function geocodeCoordinatesToAddress(input: GeocodeCoordinatesInput): Promise<GeocodeCoordinatesOutput> {
  return geocodeFlow(input);
}


// Define the Genkit prompt for fallback geocoding
const geocodeFallbackPrompt = ai.definePrompt({
  name: 'geocodeFallbackPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: { schema: GeocodeCoordinatesInputSchema },
  output: { schema: z.object({ address: z.string().describe("The street address for the given coordinates.") }) },
  prompt: `Based on the provided latitude and longitude, determine the most likely street address.
  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}
  
  Return only the formatted street address.`,
});


const geocodeFlow = ai.defineFlow(
  {
    name: 'geocodeCoordinatesToAddressFlow',
    inputSchema: GeocodeCoordinatesInputSchema,
    outputSchema: GeocodeCoordinatesOutputSchema,
  },
  async ({ latitude, longitude }) => {
    // 1. Primary Method: Nominatim API
    const userAgent = "EKTA108/1.0 (Firebase Studio Project; contact: no-reply@example.com)";
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    console.log(`[Geocoding Primary - Nominatim] Request URL: ${url}`);

    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
      if (!response.ok) throw new Error(`Nominatim API request failed with status: ${response.status}`);
      
      const data = await response.json();

      if (data && data.display_name) {
        console.log("[Geocoding Primary - Nominatim] Success:", data.display_name);
        return { formattedAddress: data.display_name };
      }
      // If Nominatim returns an error in its JSON, we'll fall through to the AI fallback.
      console.warn(`[Geocoding Primary - Nominatim] Failed to find address. Falling back to AI. Reason: ${data?.error || 'No display_name'}`);
    } catch (error) {
      console.error('🔥 [Geocoding Primary - Nominatim] Error, falling back to AI:', error instanceof Error ? error.message : String(error));
    }

    // 2. Fallback Method: Genkit AI
    console.log("[Geocoding Fallback - Genkit AI] Attempting to geocode with AI.");
    try {
      const { output } = await geocodeFallbackPrompt({ latitude, longitude });
      if (output?.address) {
        console.log("[Geocoding Fallback - Genkit AI] Success:", output.address);
        return { formattedAddress: output.address };
      }
      throw new Error("AI fallback did not return a valid address.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown AI geocoding error.";
      console.error('🔥 [Geocoding Fallback - Genkit AI] Final failure:', errorMessage);
      return { error: `Geocoding failed on all services. Last error: ${errorMessage}` };
    }
  }
);

