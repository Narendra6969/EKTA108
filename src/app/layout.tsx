
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import FirebaseProvider from '@/components/layout/FirebaseProvider';

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'AcciAssist - Emergency Accident Response Platform',
  description: 'AI-powered emergency accident response, live ambulance tracking, triage advice, and hospital coordination platform.',
  openGraph: {
    title: 'AcciAssist - Emergency Accident Response Platform',
    description: 'AI-powered emergency accident response, live ambulance tracking, triage advice, and hospital coordination platform.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
