
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin'; // USE ADMIN SDK
import { FieldValue } from 'firebase-admin/firestore'; // USE ADMIN SDK
import { z } from 'zod';

const LocationUpdateSchema = z.object({
  ambulanceId: z.string().min(1, "Ambulance ID is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validatedData = LocationUpdateSchema.safeParse(data);

    if (!validatedData.success) {
      console.error("Invalid ambulance location data:", validatedData.error.flatten().fieldErrors);
      return NextResponse.json({ message: 'Invalid location data', errors: validatedData.error.flatten().fieldErrors }, { status: 400 });
    }

    const { ambulanceId, latitude, longitude } = validatedData.data;

    const locationData = {
      latitude,
      longitude,
      lastUpdate: FieldValue.serverTimestamp() // Use serverTimestamp for reliability
    };
    
    const adminDb = getAdminDb(); // Get DB instance

    // Store location in a specific collection, e.g., 'liveAmbulanceLocations'
    // Document ID will be the ambulanceId for easy lookup and update
    await adminDb.collection("liveAmbulanceLocations").doc(ambulanceId).set(locationData, { merge: true });
    
    console.log(`Location updated for ambulance ${ambulanceId}: Lat ${latitude}, Lng ${longitude}`);
    return NextResponse.json({ message: 'Location updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to process ambulance location update:', error);
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error instanceof SyntaxError) { // For invalid JSON
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to update location: ${errorMessage}` }, { status: 500 });
  }
}
