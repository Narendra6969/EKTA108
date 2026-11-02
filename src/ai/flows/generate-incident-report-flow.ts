
'use server';
/**
 * @fileOverview Generates a comprehensive post-incident report by consolidating all available data.
 *
 * - generateIncidentReport - A function that creates a full incident report.
 * - IncidentReportInput - The input type for the generateIncidentReport function.
 * - IncidentReportOutput - The return type for the generateIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IncidentReportInputSchema = z.object({
  reportId: z.string().describe('The unique ID of the initial accident report.'),
  paramedicNotes: z.string().optional().describe("Consolidated notes from the paramedics."),
  handoverSummary: z.string().optional().describe('The AI-generated handover summary provided to the hospital.'),
  communicationLog: z.array(z.string()).optional().describe('A log of messages between the ambulance and hospital.'),
  hospitalDiagnosis: z.string().optional().describe("The final diagnosis or outcome from the hospital."),
  timeline: z.array(z.string()).optional().describe("Key events and their timestamps (e.g., '10:05 - Accident reported', '10:12 - Ambulance dispatched', '10:25 - Patient arrived at hospital').")
});
export type IncidentReportInput = z.infer<typeof IncidentReportInputSchema>;

const IncidentReportOutputSchema = z.object({
  fullReport: z.string().describe('A comprehensive, structured report suitable for official records.'),
});
export type IncidentReportOutput = z.infer<typeof IncidentReportOutputSchema>;

export async function generateIncidentReport(input: IncidentReportInput): Promise<IncidentReportOutput> {
  return generateIncidentReportFlow(input);
}

const incidentReportPrompt = ai.definePrompt({
  name: 'incidentReportPrompt',
  model: 'googleai/gemini-1.5-flash-preview-0514',
  input: {schema: IncidentReportInputSchema},
  output: {schema: IncidentReportOutputSchema},
  prompt: `You are a meticulous records keeper for an emergency response service. Your task is to generate a comprehensive and official incident report by consolidating all the information provided for the incident with ID {{{reportId}}}.

  Structure the report with the following sections:
  1.  **Incident ID:**
  2.  **Timeline of Events:** (Use the 'timeline' data)
  3.  **Initial Paramedic Assessment:** (Use 'paramedicNotes')
  4.  **AI Handover Summary to Hospital:** (Use 'handoverSummary')
  5.  **Communication Log:** (List all messages from 'communicationLog')
  6.  **Final Hospital Outcome/Diagnosis:** (Use 'hospitalDiagnosis')
  7.  **Consolidated Summary:** (Provide a brief overview of the entire incident from start to finish)

  Ensure the report is clear, professional, and well-organized. If a piece of information is not available, mark it as 'Not Available'.
  `,
});

const generateIncidentReportFlow = ai.defineFlow(
  {
    name: 'generateIncidentReportFlow',
    inputSchema: IncidentReportInputSchema,
    outputSchema: IncidentReportOutputSchema,
  },
  async input => {
    const {output} = await incidentReportPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return any output for the incident report.");
    }
    return output;
  }
);
