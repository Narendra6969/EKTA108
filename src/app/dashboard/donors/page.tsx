
"use client";

import { useState, useEffect, useCallback }from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, UserPlus, Droplets, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { useFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const organs = ["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Intestine", "Cornea", "Skin"];

type Donor = {
  id: string;
  name: string;
  bloodType: string;
  organs: string[];
  status: string;
};

function DonorsPage() {
  const { toast } = useToast();
  const db = useFirebaseDb();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorName, setDonorName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!db) return;
    setIsFetching(true);
    
    const q = query(collection(db, "donors"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const donorsData: Donor[] = [];
      querySnapshot.forEach((doc) => {
        donorsData.push({ id: doc.id, ...doc.data() } as Donor);
      });
      setDonors(donorsData);
      setIsFetching(false);
    }, (error) => {
      console.error("Error fetching donors:", error);
      toast({ variant: "destructive", title: "Failed to fetch donors", description: "Could not load donor data from the database." });
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleOrganChange = (organ: string) => {
    setSelectedOrgans(prev =>
      prev.includes(organ) ? prev.filter(o => o !== organ) : [...prev, organ]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a blood type for the donor.",
      });
      return;
    }
    if (!db) {
        toast({ variant: "destructive", title: "Database Error", description: "Firestore is not available."});
        return;
    }

    setIsLoading(true);
    const newDonorData = {
      name: donorName || "Anonymous",
      bloodType: bloodType,
      organs: selectedOrgans,
      status: "Active",
    };
    
    try {
      await addDoc(collection(db, "donors"), newDonorData);
      toast({
        title: "Donor Added Successfully",
        description: `${newDonorData.name} has been added to the donor registry.`,
      });
      // Reset form
      setDonorName("");
      setBloodType("");
      setSelectedOrgans([]);
    } catch (error) {
      console.error("Error adding donor:", error);
      toast({ variant: "destructive", title: "Failed to add donor", description: "An error occurred while saving the donor to the database." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Donors</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <DashboardCard 
            title="Add New Donor" 
            icon={<UserPlus className="h-6 w-6" />} 
            description="Register a new blood or organ donor."
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="donorName">Donor Name (Optional)</Label>
                <Input 
                  id="donorName" 
                  placeholder="e.g., John Smith or Anonymous" 
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bloodType">Blood Type *</Label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger id="bloodType">
                    <SelectValue placeholder="Select a blood type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Organs to Donate</Label>
                <div className="space-y-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                  {organs.map(organ => (
                    <div key={organ} className="flex items-center space-x-2">
                      <Checkbox 
                        id={organ}
                        checked={selectedOrgans.includes(organ)}
                        onCheckedChange={() => handleOrganChange(organ)}
                      />
                      <label htmlFor={organ} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {organ}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !db}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding Donor...</> : "Add Donor to Registry"}
              </Button>
            </form>
          </DashboardCard>
        </div>

        <div className="md:col-span-2">
            <DashboardCard title="Donor Registry" icon={<HeartPulse className="h-6 w-6" />} description="List of all registered blood and organ donors.">
                {isFetching ? (
                   <div className="flex items-center justify-center p-8">
                       <Loader2 className="h-6 w-6 animate-spin mr-2" />
                       <span>Loading donors...</span>
                   </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Donor Name</TableHead>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Organs</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donors.map(donor => (
                            <TableRow key={donor.id}>
                                <TableCell className="font-medium">{donor.name}</TableCell>
                                <TableCell>
                                    <Badge variant="destructive" className="text-sm gap-1">
                                      <Droplets className="h-3 w-3"/>{donor.bloodType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {donor.organs.length > 0 ? donor.organs.map(organ => (
                                            <Badge key={organ} variant="secondary">{organ}</Badge>
                                        )) : <span className="text-xs text-muted-foreground">None</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={donor.status === "Active" ? "bg-green-100 text-green-800" : ""}>
                                        {donor.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
                 {(!isFetching && donors.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground p-4">No donors found in the registry.</p>
                )}
            </DashboardCard>
        </div>
      </div>
    </div>
  );
}

export default DonorsPage;
