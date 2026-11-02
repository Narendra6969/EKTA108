
import { config } from 'dotenv';
config();

import '@/ai/flows/triage-advice.ts';
import '@/ai/flows/generate-handover-summary.ts';
import '@/ai/flows/suggest-doctor-group.ts';
import '@/ai/flows/geocode-address-flow.ts';
import '@/ai/flows/find-nearby-hospitals.ts';
import '@/ai/flows/recommend-best-hospital.ts';
import '@/ai/flows/get-predictive-alerts-flow.ts';
import '@/ai/flows/generate-incident-report-flow.ts';
import '@/ai/flows/generate-video-flow.ts';

