
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Siren, MessageSquareWarning, ShieldAlert, AmbulanceIcon, Hospital as HospitalIconSvg, MapPin, BedDouble, Droplets, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HospitalDetailsCard = () => (
  <Card className="bg-background/50 shadow-inner">
    <CardHeader className="pb-3 pt-4">
      <CardTitle className="text-base">Hospital Snapshot (Demo Data)</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <BedDouble className="h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold">Patient Load</p>
          <p>85% Capacity</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <Droplets className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-semibold">Blood Bank</p>
          <p>O+, A+, B-</p>
        </div>
      </div>
       <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <HeartPulse className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-semibold">Organs</p>
          <p>Cornea Avail.</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const emergencyContacts = [
    { name: 'National Emergency Number', number: '112', icon: <Siren className="h-6 w-6 text-primary" />, description: "For all emergencies (Police, Fire, Ambulance)." },
    { name: 'Police', number: '100', icon: <ShieldAlert className="h-6 w-6 text-primary" />, description: "For law enforcement and public safety." },
    { name: 'Fire Services', number: '101', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary lucide lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>, description: "For fire-related emergencies." },
    { name: 'Ambulance', number: '108 / 102', icon: <AmbulanceIcon className="h-6 w-6 text-primary" />, description: "For medical emergencies and ambulance services." },
    { name: 'Disaster Management Services', number: '1078', icon: <MessageSquareWarning className="h-6 w-6 text-primary" />, description: "For natural disasters and major incidents." },
];

export default function EmergencyServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Emergency Services & Helplines</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Quick access to critical emergency contacts and location-based services.
            </p>
          </div>

          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6 text-primary" />
                Find Nearby Hospitals
              </CardTitle>
              <CardDescription>
                Use the dedicated User Dashboard to find and view hospitals near you on a map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/user">Go to User Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {emergencyContacts.map((contact) => (
              <Card key={contact.name} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <CardHeader className="flex flex-row items-center space-x-4 pb-3">
                  {contact.icon}
                  <CardTitle className="text-xl">{contact.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{contact.description}</CardDescription>
                  <p className="text-2xl font-semibold text-primary mt-2">{contact.number}</p>
                </CardContent>
                <div className="p-4 pt-0">
                 <Button asChild className="w-full">
                    <a href={`tel:${contact.number.split(' ')[0]}`}> {/* Takes the first number if multiple */}
                      <Phone className="mr-2 h-4 w-4" /> Call Now
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-12 bg-primary/5 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2"><Siren /> Important Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The availability of these numbers may vary by region. Always confirm local emergency numbers.
                EKTA108 aims to help you connect quickly, but direct dialing is often the most reliable method in an emergency.
              </p>
              <div className="mt-4">
                <Button variant="accent" asChild>
                  <Link href="/report-accident">
                    Use EKTA108 Features
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
