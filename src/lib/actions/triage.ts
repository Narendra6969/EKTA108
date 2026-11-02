
"use server";

import { getTriageAdvice as getTriageAdviceFlow, type TriageAdviceInput } from "@/ai/flows/triage-advice";
import { findNearbyHospitals } from "@/ai/flows/find-nearby-hospitals";
import { recommendBestHospital } from "@/ai/flows/recommend-best-hospital";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from 'firebase-admin/firestore';
import type { Hospital, PatientDataForHospital, PublicAccidentReport } from "@/lib/types";

const TriageFormSchema = z.object({
  accidentDetails: z.string().min(10, { message: "SERVER: Accident details must be at least 10 characters." }),
  streetAddress: z.string().optional(),
  latitude: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  photoDataUri: z.string().nullable().optional(),
});

export type TriageFormState = {
  message?: string;
  advice?: string;
  errors?: {
    accidentDetails?: string[];
    streetAddress?: string[];
    latitude?: string[];
    longitude?: string[];
    photoDataUri?: string[];
    _form?: string[]; 
  };
  isSuccess: boolean;
  reportId?: string;
  youtubeVideoUrl?: string | null;
  // Ambulance details
  ambulanceId?: string;
  driverName?: string;
  driverPhone?: string;
  eta?: number;
  hospitalName?: string;
};

// This function now acts as the central dispatcher for a citizen-reported incident
export async function submitTriageForm(
  prevState: TriageFormState,
  formData: FormData
): Promise<TriageFormState> {
  console.log("--- (UNIFIED) SUBMIT TRIAGE FORM & ALERT HOSPITAL SERVER ACTION ---");

  const validatedFields = TriageFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your input.",
      isSuccess: false,
    };
  }
  
  const { latitude, longitude, accidentDetails, photoDataUri, streetAddress } = validatedFields.data;

  if (!latitude || !longitude) {
    return {
      message: "Location is required to find nearby hospitals and dispatch help. Please enable location services and try again.",
      isSuccess: false,
      errors: { _form: ["Location not provided."] }
    };
  }

  let aiAdvice: string | undefined = undefined;
  let youtubeVideoUrl: string | null | undefined = undefined;
  let centralReportId: string | undefined = undefined;
  let handoverDocId: string | undefined = undefined;
  let recommendedHospital: Hospital | null = null;
  let formError: string | undefined = undefined;

  const adminDb = getAdminDb();

  try {
    // Step 1: Get AI triage advice first
    try {
      const aiInput: TriageAdviceInput = {
        accidentDetails, streetAddress, latitude, longitude, photoDataUri: photoDataUri || undefined,
      };
      const aiResult = await getTriageAdviceFlow(aiInput);
      aiAdvice = aiResult.advice;
      youtubeVideoUrl = aiResult.youtubeVideoUrl;
    } catch (error) {
       console.error("AI Triage Advice Error:", error);
       let msg = "An unknown error occurred while getting AI advice.";
       if (error instanceof Error) msg = error.message;
       // We can continue without AI advice, but we'll log it.
       aiAdvice = `Could not generate AI advice due to an error: ${msg}. Proceeding with alert.`;
    }

    // Step 2: Save the report to the central `accidentReports` collection
    const reportData: Omit<PublicAccidentReport, 'id'> = {
        accidentDetails: accidentDetails,
        streetAddress: streetAddress || null,
        latitude: latitude,
        longitude: longitude,
        photoProvided: !!photoDataUri,
        aiAdvice: aiAdvice || "AI advice not generated.",
        aiError: aiAdvice?.startsWith("Could not generate") ? aiAdvice : null,
        timestamp: Timestamp.now(),
        reportedVia: "web_form"
    };
    const centralReportRef = await adminDb.collection("accidentReports").add(reportData);
    centralReportId = centralReportRef.id;
    console.log(`Central accident report saved with ID: ${centralReportId}`);

    // Step 3: Find and recommend the best hospital
    const nearbyHospitalsResult = await findNearbyHospitals({ latitude, longitude });
    if (nearbyHospitalsResult.error || nearbyHospitalsResult.hospitals.length === 0) {
      throw new Error(nearbyHospitalsResult.error || "No nearby hospitals found. Cannot proceed with alert.");
    }

    const recommendationResult = await recommendBestHospital({
      hospitals: nearbyHospitalsResult.hospitals,
      accidentDetails: accidentDetails,
    });
    
    recommendedHospital = (recommendationResult.hospital as Hospital) || nearbyHospitalsResult.hospitals[0];

    // Step 4: Send the alert to the chosen hospital's `patientHandovers` subcollection
    const patientId = `CITIZEN-${Date.now()}`;
    const handoverData: Omit<PatientDataForHospital, 'id' | 'timestamp'> = {
        hospitalId: recommendedHospital.id,
        patientId: patientId,
        observedInjuries: `Initial report from central ID ${centralReportId}: ${accidentDetails}`,
        paramedicNotes: `Reported by a citizen via web form. Address: ${streetAddress || `${latitude}, ${longitude}`}`,
        aiTriageAdvice: aiAdvice,
        injuryPhotoDataUri: photoDataUri || undefined,
        ambulanceLocation: { latitude, longitude },
        reporterSource: 'citizen',
    };
    const handoverRef = await adminDb.collection("hospitals").doc(recommendedHospital.id).collection("patientHandovers").add({
      ...handoverData,
      timestamp: Timestamp.now(),
    });
    handoverDocId = handoverRef.id;
    console.log(`Patient handover alert sent to ${recommendedHospital.name} with ID: ${handoverDocId}`);


  } catch (error) {
    console.error("Error in submitTriageForm:", error);
    if (error instanceof Error) {
        formError = `System Error: ${error.message}`;
    } else {
        formError = "An unknown system error occurred while processing the report.";
    }
  }

  if (formError) {
     return {
      message: formError,
      advice: aiAdvice, 
      youtubeVideoUrl: youtubeVideoUrl,
      isSuccess: false, 
      reportId: centralReportId,
      errors: { _form: [formError] }
    };
  }

  // --- SIMULATE AMBULANCE DISPATCH ---
  const dispatchedAmbulance = {
      ambulanceId: "AMB-EKTA-04",
      driverName: "Ravi Kumar",
      driverPhone: "+91-9988776655",
      eta: 12,
  };

  return {
    message: `Emergency alert sent successfully to ${recommendedHospital?.name}. An ambulance has been dispatched.`,
    advice: aiAdvice,
    isSuccess: true,
    reportId: centralReportId,
    hospitalName: recommendedHospital?.name,
    youtubeVideoUrl: youtubeVideoUrl,
    ...dispatchedAmbulance,
  };
}
