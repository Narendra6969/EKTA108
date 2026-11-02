
'use server';
/**
 * @fileOverview Suggests a relevant group of medical specialists based on patient's condition.
 *
 * - suggestDoctorGroup - A function that suggests a doctor group.
 * - SuggestDoctorGroupInput - The input type for the suggestDoctorGroup function.
 * - SuggestDoctorGroupOutput - The return type for the suggestDoctorGroup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDoctorGroupInputSchema = z.object({
  observedInjuries: z.string().describe('Detailed description of observed injuries.'),
  patientCondition: z.string().optional().describe("The patient's current condition (e.g., Stable, Serious, Critical)."),
  paramedicNotes: z.string().optional().describe("Paramedic's assessment and notes about the patient and scene."),
  patientAge: z.string().optional().describe('The age of the patient.'),
});
export type SuggestDoctorGroupInput = z.infer<typeof SuggestDoctorGroupInputSchema>;

const SuggestDoctorGroupOutputSchema = z.object({
  suggestedSpecialists: z.array(z.string()).describe('A list of suggested medical specializations or roles (e.g., "Trauma Surgeon", "Orthopedist", "Neurologist").'),
  reasoning: z.string().describe('A brief explanation for the suggested specialists.'),
  priorityLevel: z.enum(["High", "Medium", "Low"]).optional().describe("Suggested priority level for ER preparation based on the case.")
});
export type SuggestDoctorGroupOutput = z.infer<typeof SuggestDoctorGroupOutputSchema>;

export async function suggestDoctorGroup(input: SuggestDoctorGroupInput): Promise<SuggestDoctorGroupOutput> {
  return suggestDoctorGroupFlow(input);
}

const MOCK_HOSPITAL_SPECIALIZATIONS = [
  "Trauma Surgery",
  "Orthopedics",
  "Neurology / Neurosurgery",
  "Cardiology",
  "Pulmonology",
  "Anesthesiology",
  "General Surgery",
  "Emergency Medicine Physician",
  "Radiology",
  "Pediatrics (if patient is a child)",
  "Internal Medicine"
];

const prompt = ai.definePrompt({
  name: 'suggestDoctorGroupPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: {schema: SuggestDoctorGroupInputSchema},
  output: {schema: SuggestDoctorGroupOutputSchema},
  prompt: `You are an AI Hospital Triage Coordinator. Your role is to review initial patient information from paramedics and suggest a primary team of medical specialists that should be alerted or assembled to handle the incoming case.

  Available Specializations/Roles in the hospital include:
  ${MOCK_HOSPITAL_SPECIALIZATIONS.map(s => `- ${s}`).join('\n')}

  Patient Information:
  - Age: {{{patientAge}}}
  - Condition: {{{patientCondition}}}
  - Observed Injuries: {{{observedInjuries}}}
  - Paramedic's Assessment & Notes: {{{paramedicNotes}}}

  Based on the provided patient information, please:
  1.  Identify the most critical medical needs. The 'patientCondition' (e.g., Critical, Serious, Stable) is a key indicator of urgency and should heavily influence your suggestions.
  2.  Suggest a list of 2-4 key medical specializations from the available list that are most relevant to immediately assess and treat this patient upon arrival. If age indicates a child and injuries are severe, consider Pediatrics.
  3.  Provide a concise reasoning for your suggestions (1-2 sentences), explaining how the patient's condition and injuries led to your choice of specialists.
  4.  Suggest a priority level (High, Medium, Low) for ER preparation. A 'Critical' condition should strongly influence the suggestion of a 'High' priority level and specialists geared towards immediate life-support. A 'Stable' condition, depending on the injuries, might warrant 'Medium' or 'Low' priority for ER team assembly if injuries are localized and not immediately life-threatening, even if specific specialists are needed.

  Focus on the most immediately impactful specialists. For example, if there's head trauma, "Neurology / Neurosurgery" would be key. If multiple fractures, "Orthopedics". If cardiac symptoms, "Cardiology". A "Trauma Surgery" and "Emergency Medicine Physician" are generally good for severe multi-trauma or critical conditions.

  Return ONLY the JSON object with 'suggestedSpecialists', 'reasoning', and 'priorityLevel'.
  `,
});

const suggestDoctorGroupFlow = ai.defineFlow(
  {
    name: 'suggestDoctorGroupFlow',
    inputSchema: SuggestDoctorGroupInputSchema,
    outputSchema: SuggestDoctorGroupOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return any output for doctor group suggestion. Please try again.");
    }
    return output;
  }
);
