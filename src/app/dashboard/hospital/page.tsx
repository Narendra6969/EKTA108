
"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { BedDouble, Users, Package, Activity, BarChart3, MapPin, AlertTriangle, Info, Fingerprint, RefreshCcw, Image as ImageIconLucide, BriefcaseMedical, Warehouse, UserCheck, Megaphone, ClockIcon, AmbulanceIcon, Hospital, Syringe, ShieldCheck, Thermometer, TrafficCone, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import type { PatientDataForHospital, PublicAccidentReport } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseDb } from "@/lib/firebase"; 
import { collection, query, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow, isWithinInterval, subMinutes } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getPredictiveAlerts, type PredictiveAlertsInput, type PredictiveAlertsOutput } from "@/ai/flows/get-predictive-alerts-flow";
import { MOCK_HOSPITALS, MOCK_HOSPITAL_DATA } from "@/lib/mock-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label";


const LiveAmbulanceMapDisplay = dynamic(
  () => import('@/components/maps/LiveAmbulanceMapDisplay'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted rounded-md"><RefreshCcw className="h-5 w-5 animate-spin mr-2" />Loading Live Ambulance Map...</div> 
  }
);

function HospitalDashboard() {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(MOCK_HOSPITALS[0].id);
  const [patientHandovers, setPatientHandovers] = useState<PatientDataForHospital[]>([]);
  const [isLoadingHandovers, setIsLoadingHandovers] = useState(true);
  const [publicAccidentReports, setPublicAccidentReports] = useState<PublicAccidentReport[]>([]);
  const [isLoadingPublicReports, setIsLoadingPublicReports] = useState(true);
  const { toast } = useToast();
  const [isClientMounted, setIsClientMounted] = useState(false);
  
  const [predictiveAlerts, setPredictiveAlerts] = useState<{[key: string]: PredictiveAlertsOutput | null}>({});
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<{[key: string]: boolean}>({});

  const [expandedHandoverId, setExpandedHandoverId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferToHospitalId, setTransferToHospitalId] = useState<string>('');

  const db = useFirebaseDb();

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const generatePredictiveAlert = useCallback(async (patientData: PatientDataForHospital) => {
    if (!patientData.ambulanceLocation || !patientData.id) return;
    
    setIsLoadingAlerts(prev => ({...prev, [patientData.id!]: true}));
    setPredictiveAlerts(prev => ({...prev, [patientData.id!]: null}));
    
    const hospital = MOCK_HOSPITALS.find(h => h.id === selectedHospitalId);
    if (!hospital) {
        setIsLoadingAlerts(prev => ({...prev, [patientData.id!]: false}));
        return;
    }

    try {
        const input: PredictiveAlertsInput = {
            ambulanceId: "AMB-EKTA-01", // Mock ID
            ambulanceLocation: patientData.ambulanceLocation,
            destinationHospitalId: selectedHospitalId,
            destinationHospitalLocation: hospital.location,
            patientCondition: patientData.patientCondition || "Unknown",
            observedInjuries: patientData.observedInjuries || "Not specified",
            currentTrafficConditions: "Heavy", // Mocked for demo
            hospitalStaffing: MOCK_HOSPITAL_DATA.staffing,
            hospitalInventory: MOCK_HOSPITAL_DATA.inventory,
        };
        const alerts = await getPredictiveAlerts(input);
        setPredictiveAlerts(prev => ({...prev, [patientData.id!]: alerts}));
    } catch(error) {
        console.error("Error generating predictive alert:", error);
        toast({
            variant: "destructive",
            title: "Could not generate predictive alert",
            description: error instanceof Error ? error.message : "An unknown AI error occurred."
        })
    } finally {
        setIsLoadingAlerts(prev => ({...prev, [patientData.id!]: false}));
    }
  }, [selectedHospitalId, toast]);

  const handlePatientTransfer = async (patientData: PatientDataForHospital) => {
    if (!transferToHospitalId) {
      toast({variant: 'destructive', title: 'No Hospital Selected', description: 'Please select a hospital to transfer the patient to.'});
      return;
    }
    if (transferToHospitalId === selectedHospitalId) {
      toast({variant: 'destructive', title: 'Invalid Selection', description: 'Cannot transfer a patient to the same hospital.'});
      return;
    }

    setIsTransferring(true);

    const handoverDataForApi = {
        ...patientData,
        hospitalId: transferToHospitalId, // This is the key change
        paramedicNotes: `[Patient Transfer from ${MOCK_HOSPITALS.find(h => h.id === selectedHospitalId)?.name || 'Unknown Hospital'}] - Original Notes: ${patientData.paramedicNotes}`,
    };
    
    // Remove properties not expected by the API
    delete handoverDataForApi.id;
    delete handoverDataForApi.timestamp;

    try {
      const response = await fetch('/api/patient-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handoverDataForApi),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: "Patient Transfer Initiated",
        description: `Patient data sent to ${MOCK_HOSPITALS.find(h => h.id === transferToHospitalId)?.name}.`,
      });
      
      // Remove the patient from the current UI state to reflect the transfer
      setPatientHandovers(prevHandovers => prevHandovers.filter(p => p.id !== patientData.id));
      setExpandedHandoverId(null);


    } catch (error) {
      console.error("Error transferring patient:", error);
      let errorMessage = "Could not send patient data to the other hospital.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error During Transfer",
        description: errorMessage,
      });
    } finally {
      setIsTransferring(false);
      setTransferToHospitalId('');
    }
  }


  useEffect(() => {
    if (!selectedHospitalId || !db) return;

    setIsLoadingHandovers(true);
    setPatientHandovers([]);
    setExpandedHandoverId(null);

    const q = query(
      collection(db, "hospitals", selectedHospitalId, "patientHandovers"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const handovers: PatientDataForHospital[] = [];
      let newHandoverToExpand: string | null = null;
      let handoversToAlert: PatientDataForHospital[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        const handoverData = {
          ...data,
          id: doc.id,
          timestamp: timestamp.toDate().toISOString(),
        } as PatientDataForHospital;
        
        handovers.push(handoverData);

        const isNew = isWithinInterval(timestamp.toDate(), { start: subMinutes(new Date(), 1), end: new Date() });
        if (isNew && !expandedHandoverId && !newHandoverToExpand) {
          newHandoverToExpand = handoverData.id;
          if(handoverData.ambulanceLocation){
            handoversToAlert.push(handoverData);
          }
        }
      });
      
      setPatientHandovers(handovers);
      if (newHandoverToExpand) {
        setExpandedHandoverId(newHandoverToExpand);
        handoversToAlert.forEach(h => generatePredictiveAlert(h));
      }
      setIsLoadingHandovers(false);
    }, (error) => {
      console.error("Failed to fetch patient data for hospital dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Patient Data",
        description: "Could not load real-time patient handover data.",
      });
      setIsLoadingHandovers(false);
    });
    
    return () => unsubscribe();
    
  }, [selectedHospitalId, db, toast, generatePredictiveAlert, expandedHandoverId]);


  useEffect(() => {
    if (!db) return;
    setIsLoadingPublicReports(true);
    const q = query(collection(db, "accidentReports"), orderBy("timestamp", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports: PublicAccidentReport[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as PublicAccidentReport);
      });
      setPublicAccidentReports(reports);
      setIsLoadingPublicReports(false);
    }, (error) => {
      console.error("Error fetching public accident reports:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Public Reports",
        description: "Could not load new accident reports in real-time.",
      });
      setIsLoadingPublicReports(false);
    });

    return () => unsubscribe(); 
  }, [toast, db]);

  const handleHospitalChange = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
  };

  const isReportNew = (timestamp: Timestamp | undefined | null) => {
    if (!timestamp) return false;
    const fiveMinutesAgo = subMinutes(new Date(), 5);
    return isWithinInterval(timestamp.toDate(), { start: fiveMinutesAgo, end: new Date() });
  };
  
  const togglePatientDetails = (handoverId: string) => {
    setExpandedHandoverId(currentId => {
      const newId = currentId === handoverId ? null : handoverId;
       if (newId) {
        const patientData = patientHandovers.find(p => p.id === newId);
        if (patientData && patientData.ambulanceLocation && !predictiveAlerts[newId]) {
          generatePredictiveAlert(patientData);
        }
      }
      return newId;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <h1 className="text-3xl font-bold">Hospital Management</h1>
        <div className="min-w-[250px]">
          <Select value={selectedHospitalId} onValueChange={handleHospitalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select hospital..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_HOSPITALS.map(hospital => (
                <SelectItem key={hospital.id} value={hospital.id}>
                   <div className="flex items-center gap-2">
                    <Hospital className="h-4 w-4 text-muted-foreground" />
                    <span>{hospital.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-6">
          <DashboardCard 
            title="Incoming Patient Handovers" 
            icon={<Activity className="h-6 w-6" />} 
            description="Patient information from ambulance services and citizen reports. Updates in real-time."
          >
            {isLoadingHandovers ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading latest patient handovers...</p>
            ) : patientHandovers.length > 0 ? (
                <div className="space-y-2">
                {patientHandovers.map(handover => {
                  const alert = predictiveAlerts[handover.id!];
                  const isLoadingAlert = isLoadingAlerts[handover.id!];
                  const isExpanded = expandedHandoverId === handover.id;

                  return (
                    <Card key={handover.id} className="overflow-hidden">
                      <button className="flex justify-between items-center w-full p-4 text-left" onClick={() => togglePatientDetails(handover.id!)}>
                        <div className="flex items-center gap-3">
                            <Fingerprint className="h-5 w-5 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-semibold">{handover.patientName || "Unnamed Patient"}</p>
                              <p className="text-xs text-muted-foreground">ID: {handover.patientId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant={
                                handover.patientCondition?.toLowerCase() === "critical" ? "destructive" :
                                handover.patientCondition?.toLowerCase() === "serious" ? "secondary" : 
                                "default"
                              } className="text-xs">
                                {handover.patientCondition || "Unknown"}
                              </Badge>
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </button>

                      {isExpanded && (
                         <div className="space-y-4 p-4 pt-0 bg-muted/20">
                            {handover.reporterSource && (
                                <Badge variant="outline">
                                  {handover.reporterSource === 'citizen' ? 'Citizen Report' : 'Paramedic Handover'}
                                </Badge>
                            )}

                             {handover.observedInjuries && (
                               <div>
                                 <h4 className="font-semibold text-sm">Observed Injuries:</h4>
                                 <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{handover.observedInjuries}</p>
                               </div>
                             )}

                             {handover.paramedicNotes && (
                               <div>
                                 <h4 className="font-semibold text-sm">Paramedic/Reporter Notes:</h4>
                                 <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{handover.paramedicNotes}</p>
                               </div>
                             )}
                             
                             {handover.handoverSummary && handover.handoverSummary !== "Summary not generated." && (
                               <div>
                                 <h4 className="font-semibold text-sm">AI Handover Summary:</h4>
                                 <Textarea
                                     value={handover.handoverSummary}
                                     readOnly
                                     rows={5}
                                     className="w-full p-2 border rounded-md bg-background/50 font-mono text-xs"
                                 />
                               </div>
                             )}
                             {handover.aiTriageAdvice && (
                                <div>
                                 <h4 className="font-semibold text-sm">AI Triage Advice Given:</h4>
                                 <Textarea
                                     value={handover.aiTriageAdvice}
                                     readOnly
                                     rows={3}
                                     className="w-full p-2 border rounded-md bg-background/50 font-mono text-xs"
                                 />
                               </div>
                             )}
                             
                             {handover.suggestedDoctorGroup && (
                               <div className="mt-2 bg-primary/5 border border-primary/10 p-2 rounded-md">
                                 <h3 className="text-sm font-semibold mb-1 text-primary flex items-center gap-1"><Users className="h-4 w-4" />AI Suggested Team:</h3>
                                 {handover.suggestedDoctorGroup.priorityLevel && (
                                     <div className="mb-1">
                                         <Badge 
                                             variant={
                                                 handover.suggestedDoctorGroup.priorityLevel === "High" ? "destructive" :
                                                 handover.suggestedDoctorGroup.priorityLevel === "Medium" ? "secondary" : 
                                                 "default"
                                             } 
                                             className="text-xs"
                                         >
                                           <AlertTriangle className="inline h-3 w-3 mr-1"/> Priority: {handover.suggestedDoctorGroup.priorityLevel}
                                         </Badge>
                                     </div>
                                   )}
                                 <p className="font-medium text-xs mb-0.5">Specialists:</p>
                                 <ul className="list-disc list-inside space-y-0.5 text-xs bg-muted/30 p-1.5 rounded-md mb-1">
                                   {handover.suggestedDoctorGroup.suggestedSpecialists.map((specialist, index) => (
                                     <li key={index}>{specialist}</li>
                                   ))}
                                 </ul>
                                 <p className="font-medium text-xs mb-0.5">AI Reasoning:</p>
                                 <p className="text-xs bg-muted/30 p-1.5 rounded-md">{handover.suggestedDoctorGroup.reasoning}</p>
                               </div>
                             )}

                             {handover.injuryPhotoDataUri && (
                               <div className="pt-2">
                                 <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                                   <ImageIconLucide className="h-4 w-4 text-primary"/> Injury Photo:
                                 </h3>
                                 <div className="mt-1 p-1 border rounded-md bg-background/20 inline-block">
                                   <Image 
                                     src={handover.injuryPhotoDataUri} 
                                     alt="Uploaded injury" 
                                     width={150} 
                                     height={100} 
                                     className="rounded-md object-cover aspect-video"
                                     data-ai-hint="injury photo" 
                                   />
                                 </div>
                               </div>
                             )}

                             <DashboardCard title="Predictive Pre-Tracker" icon={<AlertTriangle className="h-5 w-5 text-destructive" />} className="bg-destructive/5 border-destructive/20">
                                {isLoadingAlert ? (
                                    <div className="flex items-center justify-center text-sm text-muted-foreground p-4">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating AI predictive alert...
                                    </div>
                                ) : alert ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-lg font-bold">
                                            <span>ETA: ~{alert.predictedEtaMinutes} minutes</span>
                                            <Badge variant="destructive">{alert.trafficClearanceSuggestion ? "HEAVY TRAFFIC" : "MODERATE TRAFFIC"}</Badge>
                                        </div>
                                        {alert.resourceWarning && (
                                            <div className="p-3 rounded-md bg-destructive/10">
                                                <h4 className="font-semibold text-destructive">Resource Warning:</h4>
                                                <p className="text-sm text-destructive-foreground/80">{alert.resourceWarning}</p>
                                            </div>
                                        )}
                                        {alert.suggestedActions.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">Suggested Actions:</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground pl-2 mt-1">
                                                    {alert.suggestedActions.map((action, index) => <li key={index}>{action}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center text-sm text-muted-foreground p-4">
                                        <Info className="mr-2 h-4 w-4" /> No active alert. Waiting for data with location.
                                    </div>
                                )}
                            </DashboardCard>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="secondary" className="w-full mt-2">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Transfer Patient to another Hospital
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Patient Transfer</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Select a destination hospital. The complete patient handover record will be sent to their system. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                  <Label htmlFor="transfer-hospital">Destination Hospital *</Label>
                                  <Select value={transferToHospitalId} onValueChange={setTransferToHospitalId}>
                                      <SelectTrigger id="transfer-hospital">
                                        <SelectValue placeholder="Select a hospital..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MOCK_HOSPITALS.filter(h => h.id !== selectedHospitalId).map(hospital => (
                                          <SelectItem key={hospital.id} value={hospital.id}>
                                            <div className="flex items-center gap-2">
                                              <Hospital className="h-4 w-4 text-muted-foreground" />
                                              <span>{hospital.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handlePatientTransfer(handover)} disabled={isTransferring || !transferToHospitalId}>
                                    {isTransferring ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</> : 'Confirm Transfer'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                         </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                <Info className="h-5 w-5" />
                <span>No new patient handover data for this hospital.</span>
              </div>
            )}
          </DashboardCard>

           <DashboardCard
              title="Recent Public Accident Reports"
              icon={<Megaphone className="h-6 w-6 text-destructive" />}
              description="Newly reported incidents from the public. Updates in real-time."
          >
              {isLoadingPublicReports ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading public reports...</p>
              ) : publicAccidentReports.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {publicAccidentReports.map((report) => (
                          <Card key={report.id} className={`bg-opacity-10 ${isReportNew(report.timestamp) ? 'bg-destructive/10 border-destructive/30 animate-pulse-once' : 'bg-destructive/5 border-destructive/20'}`}>
                              <CardHeader className="pb-2 pt-3">
                                  <CardTitle className="text-base flex justify-between items-start">
                                      <span>Report ID: {report.id.substring(0,6)}...</span>
                                      {isReportNew(report.timestamp) && <Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>}
                                  </CardTitle>
                                  <CardDescription className="text-xs flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3"/> 
                                    Reported {report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), { addSuffix: true }) : 'recently'}
                                  </CardDescription>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1.5 pt-0 pb-3">
                                  <p><strong className="font-medium">Details:</strong> {report.accidentDetails.substring(0,150)}{report.accidentDetails.length > 150 ? "..." : ""}</p>
                                  {report.streetAddress && <p><strong className="font-medium">Address:</strong> {report.streetAddress}</p>}
                                  {(report.latitude && report.longitude) && (
                                      <p><strong className="font-medium">Coords:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs mt-1">
                                      {report.photoProvided && <Badge variant="secondary"><ImageIconLucide className="h-3 w-3 mr-1"/> Photo Provided</Badge>}
                                      {report.aiAdvice && <Badge variant="outline">AI Advice Given</Badge>}
                                      {report.aiError && <Badge variant="destructive">AI Error</Badge>}
                                  </div>
                                  {report.aiAdvice && (
                                    <Textarea value={report.aiAdvice} readOnly rows={2} className="text-xs mt-1 bg-muted/50 h-auto p-1.5"/>
                                  )}
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                      <Info className="h-5 w-5" />
                      <span>No new public accident reports.</span>
                  </div>
              )}
          </DashboardCard>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          <DashboardCard title="Ambulance Live Locations" icon={<AmbulanceIcon className="h-6 w-6 text-primary" />} description="Real-time map of active ambulances. Map uses OpenStreetMap.">
            {isClientMounted ? <LiveAmbulanceMapDisplay /> : <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted rounded-md"><RefreshCcw className="h-5 w-5 animate-spin mr-2" />Initializing Map...</div>}
          </DashboardCard>
           <DashboardCard title="Bed Management" icon={<BedDouble className="h-6 w-6" />} description="Overview of bed availability.">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2">
                  <BriefcaseMedical className="h-5 w-5 text-primary"/>
                  <span>ICU Beds:</span>
                </div>
                <Badge variant="secondary" className="text-sm">5 / 10 Available</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2">
                  <BriefcaseMedical className="h-5 w-5 text-green-600"/>
                  <span>General Ward:</span>
                </div>
                <Badge className="text-sm" variant="default">25 / 50 Available</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2">
                  <BriefcaseMedical className="h-5 w-5 text-red-500"/>
                  <span>Emergency Beds:</span>
                </div>
                <Badge variant="destructive" className="text-sm">2 / 12 Occupied</Badge>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Inventory Management" icon={<Warehouse className="h-6 w-6" />} description="Real-time stock levels of critical supplies.">
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Blood Supply (O-)</span>
                  <span className="text-muted-foreground">8 Units</span>
                </div>
                <Progress value={40} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Ventilators</span>
                  <span className="text-muted-foreground">15 / 20 In Use</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Surgical Kits</span>
                  <span className="text-muted-foreground">62 Available</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

const HospitalDashboardPage = React.memo(HospitalDashboard);
export default HospitalDashboardPage;

    
