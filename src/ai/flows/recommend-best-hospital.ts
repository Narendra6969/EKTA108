
'use server';
/**
 * @fileOverview Recommends the best hospital from a given list based on accident details.
 *
 * - recommendBestHospital - A function that returns the best hospital choice.
 * - RecommendedHospitalInput - The input type for the recommendBestHospital function.
 * - RecommendedHospitalOutput - The return type for the recommendBestHospital function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Hospital } from '@/lib/types';

const HospitalSchemaForAI = z.object({
  id: z.string(),
  name: z.string(),
  specialties: z.array(z.string()).optional(),
});

const RecommendedHospitalInputSchema = z.object({
  hospitals: z.array(HospitalSchemaForAI).describe("A list of nearby hospitals with their available specialties."),
  accidentDetails: z.string().describe("A description of the accident and observed injuries."),
});
export type RecommendedHospitalInput = z.infer<typeof RecommendedHospitalInputSchema>;

const RecommendedHospitalOutputSchema = z.object({
  hospital: HospitalSchemaForAI.nullable().describe("The hospital identified as the best option. Null if no suitable option is found."),
  reasoning: z.string().describe("A brief explanation for why this hospital was recommended."),
});
export type RecommendedHospitalOutput = z.infer<typeof RecommendedHospitalOutputSchema>;

export async function recommendBestHospital(input: RecommendedHospitalInput): Promise<RecommendedHospitalOutput> {
  return recommendBestHospitalFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'recommendBestHospitalPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: { schema: RecommendedHospitalInputSchema },
  output: { schema: RecommendedHospitalOutputSchema },
  prompt: `You are an expert emergency services dispatcher. Your task is to recommend the most suitable hospital from a provided list based on the details of an accident.

Analyze the 'accidentDetails' to infer the likely type of injuries (e.g., "head injury" suggests a need for neurology, "broken leg" suggests orthopedics, "chest pain" suggests cardiology, "multiple severe injuries" suggests trauma surgery).

Then, review the list of 'hospitals' and their 'specialties'.

Your goal is to select the single best hospital from the list that has the most relevant specialties to treat the patient's likely injuries.

- If a hospital has a clear specialty match (e.g., Neurology for a head injury), prioritize it.
- If multiple hospitals have relevant specialties, you can still choose the first one on the list as it is likely the closest.
- If no hospital has a direct specialty match, choose the one with the most comprehensive-sounding services (like "Trauma Surgery" or "General Surgery").
- If the list of hospitals is empty, return null for the hospital.

Provide a concise 'reasoning' for your choice, explaining which inferred injury matched which specialty. For example: "Recommended due to available Orthopedics specialty, which is critical for treating suspected fractures."

Available Hospitals:
{{#each hospitals}}
- Hospital: {{{name}}} (ID: {{{id}}})
  - Specialties: {{#each specialties}}{{{this}}}, {{/each}}
{{/each}}

Accident Details: {{{accidentDetails}}}
`,
});

const recommendBestHospitalFlow = ai.defineFlow(
  {
    name: 'recommendBestHospitalFlow',
    inputSchema: RecommendedHospitalInputSchema,
    outputSchema: RecommendedHospitalOutputSchema,
  },
  async (input) => {
    if (input.hospitals.length === 0) {
      return { hospital: null, reasoning: "No nearby hospitals were provided to evaluate." };
    }
     if (!input.accidentDetails.trim()) {
      return { hospital: null, reasoning: "No accident details were provided to make a recommendation." };
    }

    const { output } = await recommendationPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a recommendation.");
    }
    return output;
  }
);
