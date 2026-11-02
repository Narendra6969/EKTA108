
"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, BriefcaseMedical, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { useFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

type StaffMember = {
  id: string;
  name: string;
  specialty: string;
  status: string;
  avatar: string;
};

function StaffPage() {
  const { toast } = useToast();
  const db = useFirebaseDb();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState("Available");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!db) return;
    setIsFetching(true);

    const q = query(collection(db, "staff"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const staffData: StaffMember[] = [];
      querySnapshot.forEach((doc) => {
        staffData.push({ id: doc.id, ...doc.data() } as StaffMember);
      });
      setStaff(staffData);
      setIsFetching(false);
    }, (error) => {
      console.error("Error fetching staff:", error);
      toast({ variant: "destructive", title: "Failed to fetch staff", description: "Could not load staff data from the database." });
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !specialty || !status) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields to add a new staff member.",
      });
      return;
    }
    if (!db) {
        toast({ variant: "destructive", title: "Database Error", description: "Firestore is not available."});
        return;
    }

    setIsLoading(true);
    const newStaffMemberData = {
      name: fullName,
      specialty,
      status,
      avatar: `https://i.pravatar.cc/40?u=${Date.now()}`,
    };

    try {
      await addDoc(collection(db, "staff"), newStaffMemberData);
      toast({
        title: "Staff Member Added",
        description: `${fullName} has been added to the staff roster.`,
      });
      // Reset form
      setFullName("");
      setSpecialty("");
      setStatus("Available");
    } catch (error) {
       console.error("Error adding staff member:", error);
       toast({ variant: "destructive", title: "Failed to add staff", description: "An error occurred while saving the staff member to the database." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Hospital Staff</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <DashboardCard 
            title="Add New Staff" 
            icon={<UserPlus className="h-6 w-6" />} 
            description="Add a new doctor, nurse, or other staff to the roster."
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="e.g., Dr. Sam Wilson" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty / Role</Label>
                <Input 
                  id="specialty" 
                  placeholder="e.g., General Surgeon" 
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </div>
               <div>
                <Label htmlFor="status">Current Status</Label>
                 <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="On-call">On-call</SelectItem>
                    <SelectItem value="In Surgery">In Surgery</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !db}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Staff Member"}
              </Button>
            </form>
          </DashboardCard>
        </div>

        <div className="md:col-span-2">
            <DashboardCard title="Current Staff Roster" icon={<BriefcaseMedical className="h-6 w-6" />} description="Live availability of medical personnel.">
                {isFetching ? (
                  <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading staff...</span>
                  </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map(member => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="doctor person" />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {member.name}
                                    </div>
                                </TableCell>
                                <TableCell>{member.specialty}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={member.status === "Available" ? "default" : "secondary"} className={member.status === "Available" ? "bg-green-100 text-green-800 border-green-200" : ""}>
                                        {member.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
                 {(!isFetching && staff.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground p-4">No staff members found.</p>
                )}
            </DashboardCard>
        </div>
      </div>
    </div>
  );
}

export default StaffPage;
