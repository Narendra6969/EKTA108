
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Hospital, AmbulanceIcon, Stethoscope, User, Heart, ShieldCheck, Video, BrainCircuit, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DynamicStats from "@/components/home/DynamicStats";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import dynamic from "next/dynamic";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

const LiveIncidentMap = dynamic(
    () => import('@/components/maps/LiveIncidentMap'),
    { 
      ssr: false,
      loading: () => <div className="h-[400px] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div> 
    }
);


const features = [
    {
        icon: <ShieldCheck className="h-8 w-8 text-primary" />,
        title: "Instant Accident Reporting",
        description: "Quickly report incidents with location, photos, and voice notes to alert nearby hospitals instantly.",
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "AI-Powered First Aid",
        description: "Receive immediate, AI-generated first aid advice tailored to the details of your report.",
    },
    {
        icon: <Video className="h-8 w-8 text-primary" />,
        title: "Live Video Analysis",
        description: "Use your camera for a simulated live video analysis to provide even more context to first responders.",
    },
    {
        icon: <Hospital className="h-8 w-8 text-primary" />,
        title: "Smart Hospital Selection",
        description: "Our system automatically finds and recommends the best-equipped hospital for the specific incident.",
    },
];

const portals = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: "For Citizens & Patients",
    description: "Report an accident, get first aid advice, or manage your personal health dashboard.",
    link: "/report-accident",
    linkLabel: "Report an Accident"
  },
  {
    icon: <AmbulanceIcon className="h-8 w-8 text-primary" />,
    title: "For Paramedics",
    description: "Access the field console to manage patient data, track location, and communicate with hospitals.",
    link: "/login",
    linkLabel: "Access Ambulance Console"
  },
  {
    icon: <Hospital className="h-8 w-8 text-primary" />,
    title: "For Hospital Staff",
    description: "Oversee hospital resources, manage staff, and view all incoming patient data.",
    link: "/login",
    linkLabel: "Open Management Portal"
  },
];


export default function LandingPage() {
  return (
     <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full bg-gradient-to-b from-primary/10 via-background to-background py-20 md:py-32">
             <div className="container mx-auto px-4 text-center">
                <Badge variant="outline" className="mb-4 py-1 px-3">
                    <Heart className="h-4 w-4 mr-2 text-primary" />
                    Your Partner in Emergency Response
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">The Golden Hour, Redefined.</h1>
                <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
                    AcciAssist connects accident victims with first responders and hospitals in seconds, using AI to provide critical advice when every moment counts.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="shadow-lg">
                        <Link href="/report-accident">Report an Accident Now</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/login">Access Professional Portals</Link>
                    </Button>
                </div>
            </div>
        </section>
        
        {/* Live Incident Map Section */}
        <section className="w-full py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">Live Incident Map</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">A real-time, simulated view of incidents being reported through the AcciAssist platform.</p>
                </div>
                <div className="max-w-5xl mx-auto">
                   <Card className="shadow-lg">
                       <CardContent className="p-2">
                           <LiveIncidentMap />
                       </CardContent>
                   </Card>
                </div>
            </div>
        </section>


        {/* Features Section */}
         <section className="w-full py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">How We Help</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">From the scene of the accident to the hospital bed, AcciAssist provides a seamless chain of life-saving tools.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center shadow-md hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit">
                                    {feature.icon}
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Portals Section */}
        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">Who We Serve</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Tailored dashboards for every role in the emergency response chain.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {portals.map((portal) => (
                        <Card key={portal.title} className="shadow-md hover:shadow-xl transition-shadow flex flex-col">
                            <CardHeader className="flex flex-row items-start gap-4">
                                <div className="p-3 rounded-full bg-primary/10 w-fit h-fit">
                                    {portal.icon}
                                </div>
                                <div>
                                    <CardTitle>{portal.title}</CardTitle>
                                    <CardDescription>{portal.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end">
                                <Button asChild variant="outline" className="w-full mt-2">
                                  <Link href={portal.link}>
                                      {portal.linkLabel} <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Stats section */}
        <DynamicStats />

      </main>
      <AppFooter />
    </div>
  );
}
