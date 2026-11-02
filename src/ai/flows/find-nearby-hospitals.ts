
'use server';
/**
 * @fileOverview Finds nearby hospitals based on geographic coordinates using the OpenStreetMap Nominatim API.
 *
 * - findNearbyHospitals - A function that returns a list of nearby hospitals.
 * - FindNearbyHospitalsInput - The input type for the findNearbyHospitals function.
 * - Hospital - The structure for a single hospital.
 * - FindNearbyHospitalsOutput - The return type for the findNearbyHospitals function.
 */

import {ai} from '@/ai/genkit';
import { MOCK_HOSPITALS } from '@/lib/mock-data';
import {z} from 'genkit';

const FindNearbyHospitalsInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type FindNearbyHospitalsInput = z.infer<typeof FindNearbyHospitalsInputSchema>;

const HospitalSchema = z.object({
  id: z.string().describe("A unique identifier for the hospital (from osm_id)."),
  name: z.string().describe("The name of the hospital."),
  address: z.string().optional().describe("The display address of the hospital (from display_name)."),
  latitude: z.number().optional().describe("The latitude of the hospital."),
  longitude: z.number().optional().describe("The longitude of the hospital."),
  specialties: z.array(z.string()).optional().describe("A list of medical specialties available at the hospital."),
  pincode: z.string().optional().describe("The postal code of the hospital's location."),
});
export type Hospital = z.infer<typeof HospitalSchema>;

const FindNearbyHospitalsOutputSchema = z.object({
  hospitals: z.array(HospitalSchema),
  error: z.string().optional(),
});
export type FindNearbyHospitalsOutput = z.infer<typeof FindNearbyHospitalsOutputSchema>;

export async function findNearbyHospitals(input: FindNearbyHospitalsInput): Promise<FindNearbyHospitalsOutput> {
  return findNearbyHospitalsFlow(input);
}

// Simple distance calculation (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


const findNearbyHospitalsFlow = ai.defineFlow(
  {
    name: 'findNearbyHospitalsFlow',
    inputSchema: FindNearbyHospitalsInputSchema,
    outputSchema: FindNearbyHospitalsOutputSchema,
  },
  async ({ latitude, longitude }) => {
    console.log(`[Flow] Finding nearby hospitals for lat: ${latitude}, lon: ${longitude}`);
    
    // For this demo, we will use our MOCK_HOSPITALS data and filter by distance.
    // In a real-world scenario, the OpenStreetMap API call would be here.
    try {
        const radiusKm = 20; // Search within a 20km radius

        const nearbyMockHospitals = MOCK_HOSPITALS
            .map(hospital => ({
                ...hospital,
                distance: calculateDistance(latitude, longitude, hospital.location.latitude, hospital.location.longitude)
            }))
            .filter(hospital => hospital.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance); // Sort by nearest first
        
        const hospitals: Hospital[] = nearbyMockHospitals.map(h => ({
            id: h.id,
            name: h.name,
            address: `${h.name}, near your location.`, // Mock address
            latitude: h.location.latitude,
            longitude: h.location.longitude,
            specialties: h.specialties,
            pincode: h.pincode,
        }));
        
        console.log(`[Flow] Found ${hospitals.length} hospitals within ${radiusKm}km.`);
        return { hospitals };

    } catch (error) {
      let errorMessage = 'An unknown system error occurred during the hospital search.';
      if (error instanceof Error) {
        errorMessage = `System error during hospital search: ${error.message}`;
      }
      console.error('[Flow] Catch block error:', error);
      return {
        hospitals: [],
        error: errorMessage,
      };
    }
  }
);
