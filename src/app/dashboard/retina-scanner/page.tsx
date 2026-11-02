
"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ScanEye, Camera, CheckCircle, UserCircle, Fingerprint, ShieldAlert, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Add some futuristic styles for the scanner
const scannerStyles = `
  @keyframes scan-line-anim {
    0% { top: 0; }
    100% { top: 100%; }
  }
  .scan-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
    box-shadow: 0 0 10px hsl(var(--primary));
    animation: scan-line-anim 3s linear infinite;
  }
  .reticle {
    position: absolute;
    inset: 10%;
    border-radius: 50%;
    border: 2px dashed hsl(var(--primary) / 0.5);
    box-shadow: 0 0 20px hsl(var(--primary) / 0.3) inset;
  }
`;

function RetinaScannerPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Inject styles into the head
    const styleTag = document.createElement("style");
    styleTag.innerHTML = scannerStyles;
    document.head.appendChild(styleTag);

    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      document.head.removeChild(styleTag);
    };
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    setScanComplete(false);
    setHasCameraPermission(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        variant: "destructive",
        title: "Camera Not Supported",
        description: "Your browser does not support camera access, which is required for the retina scan.",
      });
      setIsScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Simulate a scan duration
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        toast({
          title: "Scan Successful",
          description: "Identity verified successfully.",
        });
      }, 4000); // 4-second scan simulation

    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasCameraPermission(false);
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings to perform a retina scan.",
      });
    }
  };

  const resetScanner = () => {
    setIsScanning(false);
    setScanComplete(false);
    setHasCameraPermission(null);
  };

  const MockIdentityDetails = () => (
    <Card className="animate-in fade-in-50 bg-green-500/5 border-green-500/20">
      <CardHeader>
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle className="h-8 w-8"/>
          <div>
            <h3 className="text-xl font-bold">Identity Verified</h3>
            <p className="text-xs">UID: 9876-5432-1098</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <UserCircle className="h-10 w-10 text-muted-foreground"/>
          <div>
            <p className="font-semibold">Dr. Alex Johnson</p>
            <p className="text-sm text-muted-foreground">Role: Hospital Admin</p>
          </div>
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p className="flex items-center gap-1.5"><Fingerprint className="h-3 w-3"/> Biometric Match: 99.98%</p>
          <p className="flex items-center gap-1.5"><ShieldAlert className="h-3 w-3"/> Security Clearance: Level 5 (All Access)</p>
        </div>
        <Button onClick={resetScanner} className="w-full mt-4">Perform Another Scan</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Biometric Identity Verification</h1>
      <DashboardCard
        title="Retina Scanner"
        icon={<ScanEye className="h-6 w-6" />}
        description="Use the device camera for secure, futuristic identity verification (KYC)."
      >
        <div className="space-y-4">
          {scanComplete ? (
            <MockIdentityDetails />
          ) : (
            <>
              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {isScanning ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center flex-col">
                       <p className="text-primary-foreground font-bold">SCANNING...</p>
                    </div>
                    <div className="scan-line"></div>
                    <div className="reticle"></div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>Camera feed will appear here</p>
                  </div>
                )}
              </div>

              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    You must allow camera access in your browser to use the retina scanner.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={startScan} className="w-full" size="lg" disabled={isScanning}>
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scan in Progress...
                  </>
                ) : (
                  <>
                    <ScanEye className="mr-2 h-4 w-4" />
                    Start Secure Scan
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

export default RetinaScannerPage;
