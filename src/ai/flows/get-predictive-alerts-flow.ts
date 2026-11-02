
'use server';
/**
 * @fileOverview Generates predictive alerts for hospitals based on real-time data.
 *
 * - getPredictiveAlerts - A function that generates ETA and resource warnings.
 * - PredictiveAlertsInput - The input type for the getPredictiveAlerts function.
 * - PredictiveAlertsOutput - The return type for the getPredictiveAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveAlertsInputSchema = z.object({
  ambulanceId: z.string(),
  ambulanceLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  destinationHospitalId: z.string(),
  destinationHospitalLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  patientCondition: z.string().describe("Patient's condition (e.g., Critical, Stable)"),
  observedInjuries: z.string().describe("Observed injuries"),
  currentTrafficConditions: z.string().describe("e.g., 'Heavy', 'Light', 'Moderate'"),
  hospitalStaffing: z.array(z.string()).describe("List of available specialists at the hospital."),
  hospitalInventory: z.array(z.string()).describe("List of key inventory items and their status (e.g., 'O- Blood: Low', 'Ventilators: 5 available').")
});
export type PredictiveAlertsInput = z.infer<typeof PredictiveAlertsInputSchema>;

const PredictiveAlertsOutputSchema = z.object({
  predictedEtaMinutes: z.number().describe("The predicted Estimated Time of Arrival in minutes."),
  resourceWarning: z.string().nullable().describe("A warning if a required resource is low or unavailable (e.g., 'Warning: O- blood supply is low and might be required.'). Returns null if no warnings."),
  suggestedActions: z.array(z.string()).describe("A list of suggested actions for the hospital (e.g., 'Alert the Trauma Team', 'Prepare Bed 3 in ER', 'Contact regional blood bank')."),
  trafficClearanceSuggestion: z.string().optional().describe("A suggestion for police or traffic authorities, e.g., 'Suggest clearing the route along Main St for the final 2 miles.'")
});
export type PredictiveAlertsOutput = z.infer<typeof PredictiveAlertsOutputSchema>;

export async function getPredictiveAlerts(input: PredictiveAlertsInput): Promise<PredictiveAlertsOutput> {
  return getPredictiveAlertsFlow(input);
}

const predictiveAlertsPrompt = ai.definePrompt({
  name: 'predictiveAlertsPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: {schema: PredictiveAlertsInputSchema},
  output: {schema: PredictiveAlertsOutputSchema},
  prompt: `You are an AI-powered emergency dispatch coordinator. Your goal is to predict arrival times and proactively identify potential resource bottlenecks.

  An ambulance (ID: {{{ambulanceId}}}) is en route to a hospital (ID: {{{destinationHospitalId}}}).

  **Real-Time Data:**
  - Patient Condition: {{{patientCondition}}}
  - Observed Injuries: {{{observedInjuries}}}
  - Current Traffic: {{{currentTrafficConditions}}}
  - Available Hospital Staff: {{#each hospitalStaffing}}{{{this}}}, {{/each}}
  - Hospital Inventory Status: {{#each hospitalInventory}}{{{this}}}, {{/each}}

  **Task:**
  1.  **Predict ETA:** Based on the locations and traffic, estimate the ETA in minutes. A simple calculation will suffice (e.g., heavy traffic adds 5-10 mins, moderate 2-5 mins to a baseline).
  2.  **Resource Analysis:** Cross-reference the patient's injuries and condition with the hospital's available staff and inventory. Identify any potential shortages (e.g., need a neurologist but none are listed; need blood but supply is low).
  3.  **Generate Alerts & Actions:**
      - If a potential resource issue is found, formulate a clear \`resourceWarning\`. Otherwise, this should be null.
      - Create a list of concrete, actionable \`suggestedActions\` for the hospital ER staff.
      - If traffic is heavy or moderate, formulate a \`trafficClearanceSuggestion\` for authorities.

  Return ONLY the JSON object with the results.
  `,
});

const getPredictiveAlertsFlow = ai.defineFlow(
  {
    name: 'getPredictiveAlertsFlow',
    inputSchema: PredictiveAlertsInputSchema,
    outputSchema: PredictiveAlertsOutputSchema,
  },
  async input => {
    // In a real app, you might call a Google Maps API here for a true ETA.
    // For now, the prompt handles a simplified estimation.
    const {output} = await predictiveAlertsPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return any output for predictive alerts.");
    }
    return output;
  }
);
