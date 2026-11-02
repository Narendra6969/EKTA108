
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

// This API is now simplified to only handle POST requests for creating new handovers.
// GET requests are no longer needed as the hospital dashboard uses a real-time onSnapshot listener.

const PatientDataSchema = z.object({
  hospitalId: z.string().min(1, { message: "Hospital ID is required." }),
  patientId: z.string(),
  patientName: z.string().optional(),
  patientAge: z.string().optional(),
  observedInjuries: z.string().optional(),
  paramedicNotes: z.string().optional(),
  vitalSigns: z.string().optional(),
  patientCondition: z.string().optional(),
  handoverSummary: z.string().optional(),
  aiTriageAdvice: z.string().optional(),
  suggestedDoctorGroup: z.any().optional(),
  injuryPhotoDataUri: z.string().optional(),
  ambulanceLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  reporterSource: z.enum(['paramedic', 'citizen']).optional(),
});


export async function POST(request: NextRequest) {
  try {
    const jsonData = await request.json();
    const validatedData = PatientDataSchema.safeParse(jsonData);

    if (!validatedData.success) {
      console.error("Invalid patient handover data:", validatedData.error.flatten().fieldErrors);
      return NextResponse.json({ message: 'Invalid patient data provided', errors: validatedData.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { hospitalId, ...patientData } = validatedData.data;

    const patientHandoverData = {
      ...patientData,
      timestamp: Timestamp.now() 
    };
    
    const adminDb = getAdminDb();

    // Store the handover in a subcollection of the specific hospital
    const docRef = await adminDb.collection("hospitals").doc(hospitalId).collection("patientHandovers").add(patientHandoverData);

    console.log(`Patient data for hospital ${hospitalId} stored successfully with ID: ${docRef.id}`);
    return NextResponse.json({ message: 'Patient data received and stored successfully', hospitalId: hospitalId, id: docRef.id }, { status: 200 });

  } catch (error) {
    console.error('Failed to process patient data POST request:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: `Failed to store patient data: ${errorMessage}` }, { status: 500 });
  }
}
