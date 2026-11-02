
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Lightbulb, LocateFixed, HospitalIcon, AmbulanceIcon, Phone, MapPin, Camera, Image as ImageIconLucide, Mic, MicOff, CalendarIcon, Info, Video, CircleDotDashed, ShieldAlert, VideoIcon, Sparkles, Youtube } from "lucide-react";
import { submitTriageForm, type TriageFormState } from "@/lib/actions/triage";
import { geocodeCoordinatesToAddress } from "@/ai/flows/geocode-address-flow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { Hospital } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { findNearbyHospitals } from "@/ai/flows/find-nearby-hospitals";
import { recommendBestHospital, type RecommendedHospitalOutput } from "@/ai/flows/recommend-best-hospital";
import { Separator } from "../ui/separator";

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
  height: '300px',
  width: '100%',
  borderRadius: '0.375rem', 
  border: '1px solid hsl(var(--border))',
  overflow: 'hidden',
};

const MAP_DEFAULT_CENTER: LatLngExpression = [17.545, 78.432]; // Centered on user's provided coordinates
const MAP_DEFAULT_ZOOM = 14;
const MAP_TRACKING_ZOOM = 15;


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting Alert...
        </>
      ) : (
        "Send Instant Alert"
      )}
    </Button>
  );
}


export default function AccidentReportForm() {
  const initialState: TriageFormState = { message: "", isSuccess: false };
  const [state, formAction] = useActionState(submitTriageForm, initialState);
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [accidentDetails, setAccidentDetails] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const [currentPosition, setCurrentPosition] = useState<LatLngExpression | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);


  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleStartVideoAnalysis = async () => {
      setIsAnalyzingVideo(true);
      setHasCameraPermission(null); // Reset permission state
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setIsAnalyzingVideo(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        toast({
          title: 'Video Analysis Started (Simulation)',
          description: 'AI would now be analyzing the video stream for triage information.',
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsAnalyzingVideo(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
  };

  const handleStopVideoAnalysis = () => {
    setIsAnalyzingVideo(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
     toast({
      title: 'Video Analysis Stopped',
    });
  };


  useEffect(() => {
    setDate(new Date());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null); 
        };
        recognition.onresult = (event) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          }
          if (finalTranscript) {
            setAccidentDetails((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript + ' ');
            setSpeechError(null); 
          }
        };
        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event);
          let msg = `Speech error: ${event.error}`;
          if (event.error === 'not-allowed') msg = "Microphone access denied. Please allow microphone access in your browser settings.";
          if (event.error === 'no-speech') msg = "No speech detected. Please try speaking again.";
          if (event.error === 'audio-capture') msg = "Audio capture failed. Check your microphone connection.";
          if (event.error === 'network') msg = "Network error during speech recognition. Check your internet connection.";
          setSpeechError(msg); 
          setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        speechRecognitionRef.current = recognition;
      } else {
        setIsSpeechSupported(false);
      }
    }
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      }
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleNotifyContacts = () => {
    toast({
      title: "Simulating Notification",
      description: "In a real app, this would send an SMS to your emergency contacts with your location and incident details.",
    });
  };

  const fetchAddressAndHospitals = useCallback(async (lat: number, lon: number) => {
    setIsFetchingAddress(true);
    setLocationError(null);
    try {
      const addressResult = await geocodeCoordinatesToAddress({ latitude: lat, longitude: lon });

      if (addressResult.formattedAddress) {
        setStreetAddress(prev => prev || addressResult.formattedAddress);
      } else {
        toast({
          variant: "destructive",
          title: "Address Lookup Failed",
          description: "Could not auto-fill address. Please enter manually.",
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected system error occurred.";
      toast({
        variant: "destructive",
        title: "Could Not Fetch Location Data",
        description: errorMessage,
      });
    } finally {
      setIsFetchingAddress(false);
    }
  }, [toast]);


  const handleToggleLocationTracking = () => {
    if (isTrackingLocation && watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTrackingLocation(false);
      setLocationError(null); 
      toast({ title: "Location Tracking Stopped" });
    } else {
      if (navigator.geolocation) {
        setIsTrackingLocation(true); 
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos: LatLngExpression = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(newPos);
            fetchAddressAndHospitals(position.coords.latitude, position.coords.longitude);

            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                const updatedPos: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
                setCurrentPosition(updatedPos);
                if (!isTrackingLocation) setIsTrackingLocation(true); 
                setLocationError(null);
              },
              (err) => { 
                console.error("Accident report location watch error:", err);
                let errorMsg = `Error during location watch update: ${err.message}.`;
                if (err.code === err.PERMISSION_DENIED) {
                  errorMsg = "Location access was denied. Tracking cannot continue.";
                  setIsTrackingLocation(false); 
                  if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
                }
                setLocationError(errorMsg);
                toast({ variant: "destructive", title: "Location Update Issue", description: errorMsg });
              },
              { enableHighAccuracy: true, timeout: Infinity, maximumAge: 0 }
            );
            toast({ title: "Location Tracking Started", description: "Map uses OpenStreetMap." });

          },
          (error) => { 
            console.error("Accident report initial location error:", error);
            let errorMsg = `Error fetching initial location: ${error.message}.`;
            if (error.code === error.PERMISSION_DENIED) {
              errorMsg = "Location access denied. Please allow location access to use this feature.";
            }
            setLocationError(errorMsg);
            setIsTrackingLocation(false); 
            setCurrentPosition(null);
            toast({ variant: "destructive", title: "Location Error", description: errorMsg });
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
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError(null); setPhotoDataUri(null);
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
        setPhotoError("File is too large. Maximum size is 4MB.");
        event.target.value = ""; 
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setPhotoError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
        event.target.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Report Accident & Alert Services</CardTitle>
        <CardDescription>
          Your report will be sent to the nearest, most appropriate hospital automatically. Enable location to find nearby services and auto-fill your address. All location data is from OpenStreetMap.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {currentPosition && Array.isArray(currentPosition) && (
            <>
              <input type="hidden" name="latitude" value={currentPosition[0]} />
              <input type="hidden" name="longitude" value={currentPosition[1]} />
            </>
          )}
          {photoDataUri && <input type="hidden" name="photoDataUri" value={photoDataUri} />}
          
          <div className="space-y-2">
            <Label>Location Details & Live Map (OpenStreetMap)</Label>
            <div className="p-3 border rounded-md space-y-3 bg-muted/20">
              <Button type="button" variant="outline" onClick={handleToggleLocationTracking} className="w-full">
                {isTrackingLocation && !currentPosition && !locationError ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                {isTrackingLocation ? (currentPosition ? "Stop Live Location Tracking" : (locationError ? "Start Live Location Tracking" : "Acquiring Location...")) : "Start Live Location Tracking"}
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
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <MapPin className="inline mr-1.5 h-4 w-4" />
                    Live Tracking Active
                  </Badge>
                  <span>Lat: {currentPosition[0].toFixed(5)}</span>
                  <span>Lng: {currentPosition[1].toFixed(5)}</span>
                </div>
              )}
              {locationError && <p className="text-sm text-destructive mt-1">{locationError}</p>}
            </div>
            <div>
              <Label htmlFor="streetAddress" className="text-sm">Street Address</Label>
              {isFetchingAddress && <p className="text-xs text-primary my-1">Attempting to auto-fill address...</p>}
              <Input
                id="streetAddress"
                name="streetAddress" 
                placeholder="e.g., 123 Main St, Anytown (Auto-fills or enter manually)"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className={state.errors?.streetAddress ? "border-destructive" : ""}
                readOnly={isFetchingAddress} 
              />
              {state.errors?.streetAddress && (
                <p className="text-sm text-destructive mt-1">{state.errors.streetAddress[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="date">Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    disabled 
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP HH:mm") : <span>Loading date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} initialFocus disabled />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">Current date & time is automatically used.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="accidentDetails">Accident Details *</Label>
               {isSpeechSupported && (
                 <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={() => isListening ? speechRecognitionRef.current?.stop() : speechRecognitionRef.current?.start()} className="h-8 w-8">
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
               )}
            </div>
            {isListening && <p className="text-sm text-primary mb-1">Listening... Tap mic to stop.</p>}
            {speechError && <p className="text-sm text-destructive mb-1">{speechError}</p>}
            <Textarea 
              id="accidentDetails" 
              name="accidentDetails" 
              value={accidentDetails} 
              onChange={(e) => setAccidentDetails(e.target.value)} 
              placeholder="Describe the accident, injuries, environment..." 
              rows={5} 
              className={state.errors?.accidentDetails ? "border-destructive" : ""} 
            />
            {state.errors?.accidentDetails && (<p className="text-sm text-destructive mt-1">{state.errors.accidentDetails[0]}</p>)}
          </div>

           <div>
            <Label>Evidence & Quick Actions</Label>
            <div className="p-3 border rounded-md space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button type="button" variant="outline" onClick={() => hiddenFileInput.current?.click()}>
                  <Camera className="mr-2 h-5 w-5" /> {photoDataUri && !photoError ? "Change Photo" : "Add Photo"}
                </Button>
                <Button type="button" variant="outline" onClick={() => toast({ title: "Feature Coming Soon", description: "Audio recording will be implemented in a future update." })}>
                  {isRecordingAudio ? <CircleDotDashed className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
                  Record Audio
                </Button>
                 <Button type="button" variant={isAnalyzingVideo ? 'destructive' : 'outline'} onClick={isAnalyzingVideo ? handleStopVideoAnalysis : handleStartVideoAnalysis}>
                    {isAnalyzingVideo ? <CircleDotDashed className="mr-2 h-5 w-5 animate-spin" /> : <VideoIcon className="mr-2 h-5 w-5" />}
                    {isAnalyzingVideo ? "Stop Analysis" : "Live Video Analysis"}
                </Button>
              </div>
              <input type="file" ref={hiddenFileInput} onChange={handlePhotoChange} accept="image/jpeg, image/png, image/webp" capture="environment" className="hidden" id="photoFile" />
              {photoError && (<p className="text-sm text-destructive mt-1">{photoError}</p>)}
              {photoDataUri && !photoError && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1"><ImageIconLucide className="inline mr-2 h-4 w-4" />Photo Preview:</p>
                  <Image src={photoDataUri} alt="Preview" width={150} height={100} className="rounded-md object-cover aspect-video" data-ai-hint="accident scene photo" />
                </div>
              )}
                {isAnalyzingVideo && (
                    <div className="space-y-2">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access in your browser to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                        {hasCameraPermission && <Card>
                            <CardHeader className="p-2">
                                <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />AI Live Observations (Simulation)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 text-xs text-muted-foreground space-y-1">
                                <p>&bull; Detected: 1 person, appears conscious.</p>
                                <p>&bull; Respiratory Rate: Approx. 18 breaths/min (stable).</p>
                                <p>&bull; Scene: Daylight, clear weather, moderate traffic visible.</p>
                            </CardContent>
                        </Card>}
                    </div>
                )}
               <Alert variant="destructive" className="mt-4">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Emergency Action</AlertTitle>
                  <AlertDescription>
                    <Button type="button" variant="link" className="p-0 h-auto text-destructive" onClick={handleNotifyContacts}>
                      Notify Emergency Contacts
                    </Button>
                     - Instantly send your location and details.
                  </AlertDescription>
              </Alert>
            </div>
          </div>

          {state.message && !state.isSuccess && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-5 w-5" /> <p>{state.message}</p>
            </div>
          )}
          {state.message && state.isSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm p-3 bg-green-100/50 rounded-md">
              <CheckCircle2 className="h-5 w-5" /> <p>{state.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <SubmitButton />
          {state.isSuccess && (
            <Card className="w-full bg-primary/5 border-primary/20 mt-4">
              <CardHeader className="pb-3"><div className="flex items-center gap-2 text-primary"><Lightbulb className="h-6 w-6" /><CardTitle className="text-primary">AI First Aid Advice</CardTitle></div></CardHeader>
              <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{state.advice}</p>
                  
                  {state.youtubeVideoUrl && (
                    <div className="mt-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Youtube className="h-5 w-5 text-red-600"/>Visual Guide:</h4>
                      <div className="aspect-video rounded-lg overflow-hidden border">
                         <iframe
                            className="w-full h-full"
                            src={state.youtubeVideoUrl}
                            title="YouTube video player for first aid"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4">Disclaimer: AI advice is not a substitute for professional medical help. Prioritize safety and call emergency services if needed.</p>
              </CardContent>
               {state.driverName && state.driverPhone && (
                <>
                  <Separator className="my-2"/>
                  <CardHeader className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-green-700">
                            <AmbulanceIcon className="h-6 w-6" />
                            <CardTitle className="text-green-700">Ambulance Dispatched</CardTitle>
                        </div>
                        {state.hospitalName && 
                          <Badge variant="outline" className="text-xs">En route to: {state.hospitalName}</Badge>
                        }
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">An ambulance is on its way. Please stay on the line if possible and keep the patient calm.</p>
                    <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{state.driverName}</p>
                                <p className="text-xs text-muted-foreground">Vehicle ID: {state.ambulanceId}</p>
                            </div>
                            <Button asChild>
                                <a href={`tel:${state.driverPhone}`}>
                                    <Phone className="mr-2 h-4 w-4"/> Call Driver
                                </a>
                            </Button>
                        </div>
                    </div>
                    {state.eta && <p className="text-sm text-muted-foreground">Estimated arrival: ~{state.eta} minutes.</p>}
                  </CardContent>
                </>
              )}
            </Card>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

    
    