
import { Timestamp } from "firebase/firestore";
import type { SuggestDoctorGroupOutput } from "@/ai/flows/suggest-doctor-group";

// Data structure for patient information sent from an ambulance to a specific hospital.
export interface PatientDataForHospital {
  id?: string; // Optional document ID, can be added client-side if needed.
  hospitalId: string; // The ID of the destination hospital.
  patientId: string;
  patientName?: string;
  patientAge?: string;
  observedInjuries?: string;
  paramedicNotes?: string;
  vitalSigns?: string;
  patientCondition?: string;
  handoverSummary?: string; // AI summary from paramedic
  aiTriageAdvice?: string; // AI advice given to the reporter
  suggestedDoctorGroup?: SuggestDoctorGroupOutput;
  injuryPhotoDataUri?: string;
  ambulanceLocation?: {
    latitude: number;
    longitude: number;
  };
  reporterSource?: 'paramedic' | 'citizen';
  timestamp: string | Date | Timestamp; // Allow for different timestamp formats.
}


// Data structure for publicly reported accidents, stored in the main `accidentReports` collection.
export interface PublicAccidentReport {
    id: string; // Document ID from Firestore
    accidentDetails: string;
    streetAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    photoProvided: boolean;
    aiAdvice?: string | null;
    aiError?: string | null;
    timestamp: Timestamp; // Always a Firestore timestamp when read from DB.
    reportedVia?: 'web_form' | 'mobile_app' | 'automated_device';
}


// Data structure for live ambulance locations.
export interface LiveAmbulanceLocation {
    ambulanceId: string;
    latitude: number;
    longitude: number;
    lastUpdate: Timestamp;
    status?: 'en_route' | 'on_scene' | 'available' | 'at_hospital'; // Optional status field
}

// Adjusted to better match real-world API responses (e.g. from Nominatim)
export interface Hospital {
  id: string; // from osm_id
  name: string;
  address?: string; // from display_name
  latitude?: number;
  longitude?: number;
  specialties?: string[]; // Added for AI recommendation
  pincode?: string;
}
