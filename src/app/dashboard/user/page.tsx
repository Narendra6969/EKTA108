"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { CalendarCheck, ListChecks, CreditCard, UserCircle, ChevronRight, Pill, ShieldCheck, MapPin, Loader2, Hospital as HospitalIconSvg, Droplets } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import React, { useState } from 'react';
import type { Hospital as HospitalType } from '@/lib/types';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import { useToast } from "@/hooks/use-toast";
import { findNearbyHospitals } from "@/ai/flows/find-nearby-hospitals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BriefcaseMedical, Phone } from "lucide-react";
import Link from "next/link";

const NearbyServicesMap = dynamic(
  () => import('@/components/maps/NearbyServicesMap'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted rounded-md"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading Map...</div> 
  }
);

const MockPatientHistory = React.memo(({ patientId }: { patientId: string }) => (
    <Card className="my-2 shadow-inner bg-blue-500/5">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BriefcaseMedical className="h-5 w-5 text-blue-600"/> Patient Medical History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
         <p className="text-xs text-muted-foreground">In a full implementation, a verified ID would be used to securely fetch comprehensive medical records.</p>
        <div>
          <h4 className="font-semibold">Allergies</h4>
          <p className="p-2 border rounded-md bg-background/50 mt-1">Penicillin (causes rash)</p>
        </div>
        <div>
          <h4 className="font-semibold">Past Conditions</h4>
          <ul className="list-disc list-inside p-2 border rounded-md bg-background/50 mt-1">
            <li>Hypertension (diagnosed 2020)</li>
            <li>Type 2 Diabetes (diagnosed 2018)</li>
          </ul>
        </div>
         <div>
          <h4 className="font-semibold">Previous Surgeries</h4>
           <ul className="list-disc list-inside p-2 border rounded-md bg-background/50 mt-1">
            <li>Appendectomy (2015)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
));
MockPatientHistory.displayName = 'MockPatientHistory';


export default function UserDashboardPage() {
  const { toast } = useToast();
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalType[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(null);

  const mockInvoices = [
    { id: "inv1", service: "Annual Checkup", date: "2024-05-15", amount: "150.00", status: "Due", dueDate: "2024-06-15" },
    { id: "inv2", service: "Blood Panel Lab Test", date: "2024-05-18", amount: "75.50", status: "Paid", dueDate: "2024-06-01" },
    { id: "inv3", service: "Specialist Consultation", date: "2024-04-20", amount: "250.00", status: "Due", dueDate: "2024-05-20" },
  ];

  const handleFindHospitals = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    setNearbyHospitals([]);
    setUserPosition(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
        try {
          const result = await findNearbyHospitals({ latitude, longitude });
          if (result.error) {
            throw new Error(result.error);
          }
          setNearbyHospitals(result.hospitals);
          if (result.hospitals.length === 0) {
             toast({ title: "No Hospitals Found", description: "Could not find any hospitals nearby based on available data from OpenStreetMap." });
          } else {
             toast({ title: "Success", description: "Found nearby hospitals based on your location (data from OpenStreetMap)." });
          }
        } catch (error) {
          console.error("Error finding nearby hospitals:", error);
          let errorMessage = "An unexpected error occurred while fetching hospital data.";
          if (error instanceof Error) errorMessage = error.message;
          setLocationError(errorMessage);
          toast({ variant: "destructive", title: "Error", description: `Could not fetch hospital data: ${errorMessage}` });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("User geolocation error:", error);
        let msg = `Geolocation error: ${error.message}`;
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access was denied. Please enable it in your browser settings to use this feature.";
        }
        setLocationError(msg);
        setIsLoadingLocation(false);
        toast({ variant: "destructive", title: "Location Error", description: msg });
      }
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted w-full md:w-auto">
          <UserCircle className="h-10 w-10 text-primary flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Welcome, Jane Patient</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />+91 9876543210</p>
            <p className="text-xs text-muted-foreground">Patient ID: P00789</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
           <DashboardCard title="Find Care & Resources" icon={<MapPin className="h-6 w-6" />} description="Find nearby hospitals and check for donor availability.">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Find Nearby Hospitals</h3>
                  <Button onClick={handleFindHospitals} disabled={isLoadingLocation} className="w-full">
                    {isLoadingLocation ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Your Location...</>
                    ) : (
                      <>Find Hospitals Near Me</>
                    )}
                  </Button>
                  {locationError && <p className="text-sm text-destructive mt-2">{locationError}</p>}
                  {nearbyHospitals.length > 0 && userPosition && (
                    <div className="mt-4 space-y-4">
                      <NearbyServicesMap userPosition={userPosition} hospitals={nearbyHospitals} />
                      <Accordion type="single" collapsible className="w-full">
                        {nearbyHospitals.map((hospital) => (
                          <AccordionItem value={hospital.id} key={hospital.id}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-3 text-left">
                                <HospitalIconSvg className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-sm">{hospital.name}</p>
                                  {hospital.address && <p className="text-xs text-muted-foreground">{hospital.address}</p>}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">Further details about the hospital would be displayed here.</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>

                <Card className="bg-muted/40">
                  <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-destructive" /> Blood Donor Availability
                      </CardTitle>
                      <CardDescription className="text-xs">Check for available blood donors in your area (mock data).</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button className="w-full" variant="secondary">Search for Donors</Button>
                  </CardContent>
                </Card>
              </div>
          </DashboardCard>

          <DashboardCard title="Health Insurance" icon={<ShieldCheck className="h-6 w-6" />} description="Your current health coverage details.">
            <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-semibold">National Health Assurance</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Policy Number:</span>
                    <span className="font-semibold">NH-987654321</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span className="font-semibold">12/31/2025</span>
                </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full">View Coverage Details</Button>
          </DashboardCard>

           <DashboardCard title="Upcoming Appointments" icon={<CalendarCheck className="h-6 w-6" />} description="Manage your scheduled visits.">
            <div className="p-3 bg-primary/10 rounded-md shadow-sm">
              <p className="font-semibold">Dr. Emily Carter - General Checkup</p>
              <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-primary hover:underline">Reschedule / Cancel</Button>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">View All Appointments</Button>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <MockPatientHistory patientId="P00789" />
          
          <DashboardCard title="Medical Records & Lab Tests" icon={<ListChecks className="h-6 w-6" />} description="Access your health history and lab results.">
            <ul className="space-y-2">
              <li className="text-sm p-2 hover:bg-muted/30 rounded-md cursor-pointer flex justify-between items-center">
                <span>Lab Results - Blood Panel (2024-05-18)</span> <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li className="text-sm p-2 hover:bg-muted/30 rounded-md cursor-pointer flex justify-between items-center">
                <span>Consultation Notes - Dr. Davis (2024-02-28)</span> <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li className="text-sm p-2 hover:bg-muted/30 rounded-md cursor-pointer flex justify-between items-center">
                <span>Immunization Record</span> <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
            </ul>
            <Button variant="secondary" size="sm" className="mt-4 w-full">View All Records & Tests</Button>
          </DashboardCard>

           <DashboardCard title="Billing & Payments" icon={<CreditCard className="h-6 w-6" />} description="View invoices and make payments.">
            {mockInvoices.filter(inv => inv.status === "Due").length > 0 ? (
              <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Service</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInvoices.filter(inv => inv.status === "Due").slice(0,2).map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell className="py-2">
                            <p className="font-medium text-sm">{invoice.service}</p>
                            <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm py-2">${invoice.amount}</TableCell>
                          <TableCell className="text-center py-2">
                            <Button variant="destructive" size="sm" onClick={() => toast({ title: "Payment Initiated", description: `Processing payment for ${invoice.service} - $${invoice.amount}` })}>Pay Now</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {mockInvoices.filter(inv => inv.status === "Due").length > 2 && (
                      <Button variant="secondary" size="sm" className="w-full mt-2">View All Outstanding Bills</Button>
                  )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No outstanding bills.</p>
              </div>
            )}
              <Button variant="outline" size="sm" className="mt-4 w-full">View Billing History</Button>
          </DashboardCard>
          
           <DashboardCard title="Current Medications" icon={<Pill className="h-6 w-6" />} description="View and manage your prescribed medications.">
              <p className="text-sm text-muted-foreground text-center py-4">A summary of medications can be shown here.</p>
              <Button asChild variant="secondary" size="sm" className="w-full mt-2">
                  <Link href="/dashboard/medications">Manage Medications</Link>
              </Button>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
