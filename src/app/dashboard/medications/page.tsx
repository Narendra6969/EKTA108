
"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Pill, PlusCircle } from "lucide-react";
import React from 'react';

const mockMedications = [
    { id: "med1", name: "Lisinopril", dosage: "10mg", frequency: "Once daily", refillDate: "2024-07-15" },
    { id: "med2", name: "Metformin", dosage: "500mg", frequency: "Twice daily", refillDate: "2024-08-01" },
    { id: "med3", name: "Atorvastatin", dosage: "20mg", frequency: "Once daily at night", refillDate: "2024-07-20" },
];

function MedicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Medications</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Medication
        </Button>
      </div>
      <p className="text-muted-foreground">
        Here is a list of your current prescribed medications. Please consult your doctor before making any changes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockMedications.map((med) => (
            <DashboardCard 
                key={med.id} 
                title={med.name}
                icon={<Pill className="h-6 w-6" />}
                description={`${med.dosage} - ${med.frequency}`}
            >
                <div className="text-sm">
                    <p className="text-primary font-semibold">Next Refill: {med.refillDate}</p>
                </div>
            </DashboardCard>
        ))}
      </div>
    </div>
  );
}

export default MedicationsPage;
