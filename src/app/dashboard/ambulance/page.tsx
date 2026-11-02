
"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, UserPlus, MapPin, Send, AmbulanceIcon as AmbulanceIconSvg, Loader2, FileTextIcon, Users, AlertTriangle, Camera, Image as ImageIconLucide, LocateFixed, Hospital, Droplets, HeartPulse, MessageSquare } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { generateHandoverSummary, type HandoverSummaryInput } from "@/ai/flows/generate-handover-summary";
import { suggestDoctorGroup, type SuggestDoctorGroupInput, type SuggestDoctorGroupOutput } from "@/ai/flows/suggest-doctor-group";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { PatientDataForHospital, Hospital as HospitalType } from '@/lib/types';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findNearbyHospitals } from "@/ai/flows/find-nearby-hospitals";


const DynamicLeafletMapDisplay = dynamic(
  () => import('@/components/maps/LeafletMapDisplay'),
  {
    ssr: false,
    loading: () => (
      <div style={MAP_CONTAINER_STYLE} className="flex items-center justify-center text-sm text-muted-foreground bg-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Map Interface...
      </div>
    ),
  }
);

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  height: '250px', 
  width: '100%',
  borderRadius: '0.375rem', 
  border: '1px solid hsl(var(--border))',
  overflow: 'hidden',
};

const MAP_DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629]; 
const MAP_DEFAULT_ZOOM = 5;
const MAP_TRACKING_ZOOM = 15;
const AMBULANCE_ID = "AMB-EKTA-01"; // Demo Ambulance ID

function AmbulanceDashboard() {
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [observedInjuries, setObservedInjuries] = useState("");
  const [paramedicNotes, setParamedicNotes] = useState("");
  const [vitalSigns, setVitalSigns] = useState("");
  const [patientCondition, setPatientCondition] = useState("");
  const [destinationHospitalId, setDestinationHospitalId] = useState<string>("");

  const [handoverSummary, setHandoverSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [suggestedDoctorGroup, setSuggestedDoctorGroup] = useState<SuggestDoctorGroupOutput | null>(null);
  const [isLoadingDoctorGroup, setIsLoadingDoctorGroup] = useState(false);

  const [injuryPhotoFile, setInjuryPhotoFile] = useState<File | null>(null);
  const [injuryPhotoDataUri, setInjuryPhotoDataUri] = useState<string | null>(null);
  const [injuryPhotoError, setInjuryPhotoError] = useState<string | null>(null);
  const hiddenInjuryPhotoInput = useRef<HTMLInputElement>(null);
  const [isSendingData, setIsSendingData] = useState(false);

  const [currentPosition, setCurrentPosition] = useState<LatLngExpression | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const lastSentLocationRef = useRef<{ lat: number, lng: number } | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [communicationLog, setCommunicationLog] = useState([
    { time: "10:35 AM", from: "Dr. Smith (Hospital)", message: "Prepare ER Bed 3, possible head trauma." },
    { time: "10:32 AM", from: "Paramedic (Ambulance)", message: "En route with male, 35, MVA victim. Vitals stable." },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalType[]>([]);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);
  const hasStartedTracking = useRef(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Geolocation cleanup & interval cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);
  
  const fetchNearbyHospitals = useCallback(async (latitude: number, longitude: number) => {
    setIsFetchingHospitals(true);
    try {
        const result = await findNearbyHospitals({ latitude, longitude });
        if (result.error) throw new Error(result.error);
        setNearbyHospitals(result.hospitals);
        if (result.hospitals.length > 0) {
            // Automatically select the first hospital (which is the nearest)
            setDestinationHospitalId(result.hospitals[0].id);
            toast({ title: "Found Nearby Hospitals", description: "The nearest hospital has been selected as the default destination." });
        } else {
            toast({ title: "No Hospitals Found", description: "No hospitals found within the search radius." });
        }
    } catch(error) {
        console.error("Error fetching nearby hospitals:", error);
        let msg = "Could not fetch nearby hospitals.";
        if (error instanceof Error) msg = error.message;
        toast({ variant: "destructive", title: "Hospital Search Failed", description: msg });
    } finally {
        setIsFetchingHospitals(false);
    }
  }, [toast]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setIsSendingMessage(true);
    // Simulate API call
    setTimeout(() => {
      const newLogEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        from: "Paramedic (Ambulance)",
        message: newMessage,
      };
      setCommunicationLog(prev => [newLogEntry, ...prev]);
      setNewMessage("");
      setIsSendingMessage(false);
      toast({ title: "Message Sent", description: "Your message has been logged." });
    }, 500);
  };


  const sendLocationUpdate = useCallback(async (position: LatLngExpression) => {
    if (!Array.isArray(position) || position.length !== 2) return;
    const [latitude, longitude] = position;

    if (lastSentLocationRef.current?.lat === latitude && lastSentLocationRef.current?.lng === longitude) {
      return;
    }
    
    try {
      const response = await fetch('/api/ambulance-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulanceId: AMBULANCE_ID, latitude, longitude }),
      });
      if (response.ok) {
        lastSentLocationRef.current = { lat: latitude, lng: longitude };
      } else {
        const errorData = await response.json();
        console.error('Failed to send ambulance location:', errorData.message || response.statusText);
      }
    } catch (error) {
      console.error('Error sending ambulance location update:', error);
    }
  }, []);

  const handleToggleLocationTracking = useCallback(() => {
    if (isTrackingLocation && watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTrackingLocation(false);
      setLocationError(null);
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      setNearbyHospitals([]);
      setDestinationHospitalId("");
      hasStartedTracking.current = false;
      toast({ title: "Ambulance Location Tracking Stopped" });
    } else {
      if (navigator.geolocation) {
        setIsTrackingLocation(true); 
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos: LatLngExpression = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(newPos);
            sendLocationUpdate(newPos); 
            fetchNearbyHospitals(position.coords.latitude, position.coords.longitude);
            
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                const updatedPos: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
                setCurrentPosition(updatedPos);
                if (!isTrackingLocation) setIsTrackingLocation(true); 
                setLocationError(null); 
              },
              (err) => { 
                console.error("Ambulance location watch error:", err);
                let errorMsg = `Error during location watch: ${err.message}.`;
                if (err.code === err.PERMISSION_DENIED) {
                  errorMsg = "Location access denied. Tracking stopped.";
                  setIsTrackingLocation(false); 
                  setCurrentPosition(null);
                  if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                  }
                  if (locationUpdateIntervalRef.current) {
                    clearInterval(locationUpdateIntervalRef.current);
                    locationUpdateIntervalRef.current = null;
                  }
                } else {
                   errorMsg += " Will keep trying for updates.";
                }
                setLocationError(errorMsg);
                toast({
                  variant: err.code === err.PERMISSION_DENIED ? "destructive" : "default",
                  title: "Ambulance Location Update Issue",
                  description: errorMsg,
                  duration: err.code === err.PERMISSION_DENIED ? 5000: 3000,
                });
              },
              { enableHighAccuracy: true, timeout: Infinity, maximumAge: 0 }
            );

            if (locationUpdateIntervalRef.current) clearInterval(locationUpdateIntervalRef.current);
            locationUpdateIntervalRef.current = setInterval(() => {
              if (currentPosition) { 
                sendLocationUpdate(currentPosition);
              }
            }, 10000);

            toast({ title: "Ambulance Location Tracking Started", description: "Map uses OpenStreetMap. Location sent every 10s." });
          },
          (error) => { 
            console.error("Ambulance initial location error:", error);
            let errorMsg = `Error fetching initial location: ${error.message}.`;
            if (error.code === error.PERMISSION_DENIED) {
              errorMsg = "Location access denied. Please allow to use this feature.";
            }
            setLocationError(errorMsg);
            setIsTrackingLocation(false); 
            setCurrentPosition(null);
            toast({ variant: "destructive", title: "Ambulance Location Error", description: errorMsg });
          },
          { enableHighAccuracy: true, timeout: Infinity, maximumAge: 0 }
        );
      } else {
        const noGeoMsg = "Geolocation is not supported by this browser.";
        setLocationError(noGeoMsg);
        setIsTrackingLocation(false);
        toast({ variant: "destructive", title: "Geolocation Not Supported", description: noGeoMsg });
      }
    }
  }, [isTrackingLocation, toast, sendLocationUpdate, currentPosition, fetchNearbyHospitals]);
  
  useEffect(() => {
    if (isClientMounted && !hasStartedTracking.current) {
      handleToggleLocationTracking();
      hasStartedTracking.current = true;
    }
  }, [isClientMounted, handleToggleLocationTracking]);


  const handleGenerateSummary = async () => {
    if (!observedInjuries || !paramedicNotes) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in at least 'Observed Injuries' and 'Paramedic's Assessment / Notes' to generate a summary.",
      });
      return;
    }

    setIsLoadingSummary(true);
    setHandoverSummary("");
    try {
      const input: HandoverSummaryInput = {
        patientName: patientName || undefined,
        patientAge: patientAge || undefined,
        observedInjuries,
        paramedicNotes,
        vitalSigns: vitalSigns || undefined,
        patientCondition: patientCondition || undefined,
      };
      const result = await generateHandoverSummary(input);
      setHandoverSummary(result.handoverSummary);
      toast({
        title: "AI Handover Summary Generated",
        description: "The patient handover summary has been successfully generated.",
      });
    } catch (error) {
      console.error("Error generating handover summary:", error);
      let errorMessage = "Failed to generate handover summary.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSuggestDoctorGroup = async () => {
    if (!observedInjuries && !paramedicNotes && !patientCondition) {
       toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide observed injuries, paramedic notes, or patient condition for AI to suggest a team.",
      });
      return;
    }
    setIsLoadingDoctorGroup(true);
    setSuggestedDoctorGroup(null);
    try {
      const input: SuggestDoctorGroupInput = {
        observedInjuries,
        patientCondition: patientCondition || undefined,
        paramedicNotes: paramedicNotes || undefined,
        patientAge: patientAge || undefined,
      };
      const result = await suggestDoctorGroup(input);
      setSuggestedDoctorGroup(result);
      toast({
        title: "AI Doctor Team Suggestion Received",
        description: "A preliminary doctor team has been suggested by AI.",
      });
    } catch (error) {
      console.error("Error suggesting doctor group:", error);
       let errorMessage = "Failed to suggest doctor team.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoadingDoctorGroup(false);
    }
  };

  const handleInjuryPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setInjuryPhotoError(null);
    setInjuryPhotoDataUri(null);
    setInjuryPhotoFile(null);

    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Max 4MB
        setInjuryPhotoError("File is too large. Maximum size is 4MB.");
        event.target.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setInjuryPhotoError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
        event.target.value = "";
        return;
      }
      setInjuryPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInjuryPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendDataToHospital = async () => {
    if (!destinationHospitalId) {
      toast({ variant: "destructive", title: "Missing Destination", description: "Please select a destination hospital before sending data." });
      return;
    }
    if (!handoverSummary && (!observedInjuries || !paramedicNotes)) {
      toast({
        variant: "destructive",
        title: "No Data to Send",
        description: "Please ensure critical patient information is filled or generate an AI handover summary first.",
      });
      return;
    }

    setIsSendingData(true);
    const patientId = `PAT-${Date.now()}`; 

    const patientDataForHospital: Omit<PatientDataForHospital, 'timestamp' | 'id'> = {
      hospitalId: destinationHospitalId,
      patientId,
      patientName: patientName || "N/A",
      patientAge: patientAge || "N/A",
      observedInjuries,
      paramedicNotes,
      vitalSigns: vitalSigns || "N/A",
      patientCondition: patientCondition || "N/A",
      handoverSummary: handoverSummary || "Summary not generated.",
      suggestedDoctorGroup: suggestedDoctorGroup || undefined,
      injuryPhotoDataUri: injuryPhotoDataUri || undefined,
      ambulanceLocation: currentPosition && Array.isArray(currentPosition) ? { latitude: currentPosition[0], longitude: currentPosition[1] } : undefined,
      reporterSource: 'paramedic',
    };

    try {
      const response = await fetch('/api/patient-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientDataForHospital),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: "Patient Data Sent",
        description: `Patient ID ${patientId}: Data has been sent to the selected hospital.`,
      });
    } catch (error) {
      console.error("Error sending data to hospital:", error);
      let errorMessage = "Could not send patient data to hospital.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error Sending Data",
        description: errorMessage,
      });
    } finally {
      setIsSendingData(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ambulance Field Console</h1>
      <p className="text-sm text-muted-foreground">Ambulance ID: <Badge variant="outline">{AMBULANCE_ID}</Badge></p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard title="Patient & Destination" icon={<UserPlus className="h-6 w-6" />} description="Record patient information and select destination hospital.">
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" placeholder="John Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="patientAge">Age</Label>
                  <Input id="patientAge" type="number" placeholder="35" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="destinationHospital">Destination Hospital *</Label>
                <Select value={destinationHospitalId} onValueChange={setDestinationHospitalId} disabled={isFetchingHospitals || !isTrackingLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                        isTrackingLocation 
                        ? (isFetchingHospitals ? "Searching for hospitals..." : "Select destination...") 
                        : "Location tracking is off..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {nearbyHospitals.map(hospital => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        <div className="flex items-center gap-2">
                          <Hospital className="h-4 w-4 text-muted-foreground" />
                          <span>{hospital.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-1">
                    Hospitals are sorted by nearest first. The closest is selected by default.
                </p>
              </div>


              <div>
                <Label htmlFor="injuries">Observed Injuries *</Label>
                <Textarea id="injuries" placeholder="e.g., Laceration on forehead, suspected fracture in left arm" value={observedInjuries} onChange={(e) => setObservedInjuries(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="paramedicNotes">Paramedic's Assessment / Notes *</Label>
                <Textarea id="paramedicNotes" placeholder="e.g., Patient found conscious but disoriented. Complaining of severe headache. Scene safety secured." rows={3} value={paramedicNotes} onChange={(e) => setParamedicNotes(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="vitalSigns">Vital Signs</Label>
                <Input id="vitalSigns" placeholder="BP: 120/80, HR: 75, SpO2: 98%" value={vitalSigns} onChange={(e) => setVitalSigns(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="condition">Patient Condition</Label>
                <Select value={patientCondition} onValueChange={setPatientCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuryPhotoBtn">Upload Injury Photo (Optional)</Label>
                <Button
                  id="injuryPhotoBtn"
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => hiddenInjuryPhotoInput.current?.click()}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  <span>{injuryPhotoDataUri && !injuryPhotoError ? "Change Injury Photo" : "Add Injury Photo"}</span>
                </Button>
                <input
                  type="file"
                  ref={hiddenInjuryPhotoInput}
                  onChange={handleInjuryPhotoChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  id="injuryPhotoFile"
                />
                {injuryPhotoError && (
                  <p className="text-sm text-destructive mt-1">{injuryPhotoError}</p>
                )}
                {injuryPhotoDataUri && !injuryPhotoError && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center"><ImageIconLucide className="mr-2 h-4 w-4"/>Injury Photo Preview:</p>
                    <Image src={injuryPhotoDataUri} alt="Injury preview" width={150} height={100} className="rounded-md object-cover aspect-[3/2]" data-ai-hint="injury photo patient" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Max file size: 4MB. Accepted types: JPG, PNG, WEBP.</p>
              </div>


              <div className="space-y-3 pt-3">
                <Button type="button" onClick={handleGenerateSummary} disabled={isLoadingSummary || !observedInjuries || !paramedicNotes} className="w-full">
                  {isLoadingSummary ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Summary...</>
                  ) : (
                    <><FileTextIcon className="mr-2 h-4 w-4" />Generate AI Handover Summary</>
                  )}
                </Button>
                {handoverSummary && (
                  <DashboardCard title="AI Generated Handover Summary" icon={<FileTextIcon className="h-5 w-5" />} description="Review the AI-generated summary below.">
                      <Textarea
                          value={handoverSummary}
                          readOnly
                          rows={10}
                          className="w-full p-2 border rounded-md bg-muted/50 font-mono text-xs"
                          placeholder="AI handover summary will appear here..."
                      />
                  </DashboardCard>
                )}

                <Button type="button" onClick={handleSuggestDoctorGroup} disabled={isLoadingDoctorGroup || (!observedInjuries && !paramedicNotes && !patientCondition)} className="w-full">
                  {isLoadingDoctorGroup ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suggesting Team...</>
                  ) : (
                    <><Users className="mr-2 h-4 w-4" />AI Suggest Doctor Team</>
                  )}
                </Button>

                {suggestedDoctorGroup && (
                  <DashboardCard title="AI Suggested Doctor Team" icon={<Users className="h-5 w-5" />} description="Preliminary team suggestion by AI.">
                    {suggestedDoctorGroup.priorityLevel && (
                      <div className="mb-2">
                          <Badge 
                              variant={
                                  suggestedDoctorGroup.priorityLevel === "High" ? "destructive" :
                                  suggestedDoctorGroup.priorityLevel === "Medium" ? "secondary" : 
                                  "default"
                              } 
                              className="text-sm"
                          >
                            <AlertTriangle className="inline h-4 w-4 mr-1.5"/> Priority: {suggestedDoctorGroup.priorityLevel}
                          </Badge>
                      </div>
                    )}
                    <p className="font-semibold text-sm mb-1">Suggested Specialists:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm bg-muted/30 p-3 rounded-md">
                      {suggestedDoctorGroup.suggestedSpecialists.map((specialist, index) => (
                        <li key={index}>{specialist}</li>
                      ))}
                    </ul>
                    <p className="font-semibold text-sm mt-3 mb-1">Reasoning:</p>
                    <p className="text-sm bg-muted/30 p-3 rounded-md">{suggestedDoctorGroup.reasoning}</p>
                  </DashboardCard>
                )}
              </div>
              
              <Button type="button" className="w-full mt-4" onClick={handleSendDataToHospital} disabled={isSendingData || !destinationHospitalId}>
                {isSendingData ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending Data...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send Data to Hospital</>
                )}
              </Button>
            </form>
          </DashboardCard>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <DashboardCard title="Ambulance Live Status" icon={<MapPin className="h-6 w-6" />} description="Real-time GPS tracking of the ambulance.">
            <div className="space-y-3">
              <Button type="button" variant="outline" onClick={handleToggleLocationTracking} className="w-full">
                <LocateFixed className="mr-2 h-4 w-4" />
                {isTrackingLocation ? "Stop Live Location Tracking" : "Tracking is Off"}
              </Button>
              
              {isClientMounted && (
                  <DynamicLeafletMapDisplay
                    defaultCenter={MAP_DEFAULT_CENTER}
                    defaultZoom={MAP_DEFAULT_ZOOM}
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    currentPosition={currentPosition}
                    trackingZoom={MAP_TRACKING_ZOOM}
                  />
              )}

              {isTrackingLocation && currentPosition && Array.isArray(currentPosition) && (
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-sm bg-green-100 text-green-700">
                    <MapPin className="inline mr-1.5 h-4 w-4" />
                    Live Tracking Active
                  </Badge>
                  <span>Lat: {currentPosition[0].toFixed(5)}</span>
                  <span>Lng: {currentPosition[1].toFixed(5)}</span>
                </div>
              )}
              {locationError && <p className="text-sm text-destructive mt-1">{locationError}</p>}
            </div>
          </DashboardCard>

          <DashboardCard title="Communication Log" icon={<MessageSquare className="h-6 w-6" />} description="Log of communications with hospital.">
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {communicationLog.map((log, index) => (
                <div key={index} className="text-xs p-2 bg-muted/50 rounded-md">
                  <span className="font-semibold">{log.from} ({log.time}):</span>
                  <p className="text-muted-foreground italic">"{log.message}"</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type message to hospital..."
                disabled={isSendingMessage}
                onKeyDown={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={isSendingMessage || !newMessage.trim()}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

const AmbulanceDashboardPage = React.memo(AmbulanceDashboard);
export default AmbulanceDashboardPage;

    

    