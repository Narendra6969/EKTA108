
'use server';
/**
 * @fileOverview Generates an AI-powered patient handover summary.
 *
 * - generateHandoverSummary - A function that creates a concise handover report.
 * - HandoverSummaryInput - The input type for the generateHandoverSummary function.
 * - HandoverSummaryOutput - The return type for the generateHandoverSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HandoverSummaryInputSchema = z.object({
  patientName: z.string().optional().describe('The name of the patient.'),
  patientAge: z.string().optional().describe('The age of the patient.'),
  observedInjuries: z.string().describe('Description of observed injuries.'),
  paramedicNotes: z.string().describe("Paramedic's assessment and notes about the patient and scene."),
  vitalSigns: z.string().optional().describe('Recorded vital signs (e.g., BP, HR, SpO2).'),
  patientCondition: z.string().optional().describe("The patient's current condition (e.g., Stable, Serious, Critical)."),
});
export type HandoverSummaryInput = z.infer<typeof HandoverSummaryInputSchema>;

const HandoverSummaryOutputSchema = z.object({
  handoverSummary: z.string().describe('A concise, structured patient handover summary for hospital ER staff.'),
});
export type HandoverSummaryOutput = z.infer<typeof HandoverSummaryOutputSchema>;

export async function generateHandoverSummary(input: HandoverSummaryInput): Promise<HandoverSummaryOutput> {
  return handoverSummaryFlow(input);
}

const handoverSummaryPrompt = ai.definePrompt({
  name: 'handoverSummaryPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: {schema: HandoverSummaryInputSchema},
  output: {schema: HandoverSummaryOutputSchema},
  prompt: `You are an experienced emergency medical dispatcher. Your task is to generate a concise, structured patient handover report for a hospital Emergency Room based on the information provided by paramedics.

  Patient Information:
  - Name: {{{patientName}}}
  - Age: {{{patientAge}}}
  - Condition: {{{patientCondition}}}

  Incident Details:
  - Observed Injuries: {{{observedInjuries}}}
  - Paramedic's Assessment & Notes: {{{paramedicNotes}}}
  - Vital Signs: {{{vitalSigns}}}

  Based on all the above information, create a handover summary. The summary should be:
  1.  **Brief and to the point.**
  2.  **Structured** with clear sections (e.g., Patient Overview, Key Findings, Vital Signs Summary, Suspected Issues & Alerts).
  3.  **Highlight critical information** and potential immediate needs for the ER team.
  4.  Use professional medical terminology where appropriate but ensure clarity.

  Example of desired output structure:

  **PATIENT HANDOVER REPORT**

  **Patient:** [Name, if provided], [Age, if provided]
  **Condition:** [Patient Condition, if provided]

  **Situation Overview:**
  [Brief summary derived from paramedicNotes and observedInjuries, e.g., "Patient involved in a motor vehicle accident, conscious but disoriented."]

  **Key Findings/Injuries:**
  - [Bulleted list of key injuries from observedInjuries and paramedicNotes]

  **Vital Signs Summary:**
  - [Summarize or list vitalSigns, e.g., "BP: 120/80, HR: 75, SpO2: 98%"]

  **Paramedic's Key Assessment Points:**
  - [Key insights or concerns from paramedicNotes]

  **Potential Alerts & Immediate Considerations for ER:**
  - [AI's inference on potential critical issues, e.g., "Suspected concussion due to head impact." or "Monitor for signs of internal bleeding."]

  Provide only the handover summary text.
  `,
});

const handoverSummaryFlow = ai.defineFlow(
  {
    name: 'handoverSummaryFlow',
    inputSchema: HandoverSummaryInputSchema,
    outputSchema: HandoverSummaryOutputSchema,
  },
  async input => {
    const {output} = await handoverSummaryPrompt(input);
     if (!output) {
      throw new Error("The AI model did not return any output for the handover summary. Please try again.");
    }
    return output;
  }
);
