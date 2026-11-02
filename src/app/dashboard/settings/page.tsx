
"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserCog, Bell, Shield, UserPlus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type EmergencyContact = {
  id: number;
  name: string;
  phone: string;
};

function SettingsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: 1, name: "Spouse", phone: "555-123-4567" },
    { id: 2, name: "Parent", phone: "555-890-1234" },
  ]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both a name and a phone number for the contact.",
      });
      return;
    }
    setIsAddingContact(true);
    setTimeout(() => {
      const newContact = {
        id: Date.now(),
        name: newContactName,
        phone: newContactPhone,
      };
      setContacts([...contacts, newContact]);
      setNewContactName("");
      setNewContactPhone("");
      setIsAddingContact(false);
      toast({ title: "Contact Added", description: `${newContact.name} has been added to your emergency contacts.` });
    }, 500);
  };

  const handleRemoveContact = (id: number) => {
    setContacts(contacts.filter(c => c.id !== id));
    toast({ title: "Contact Removed" });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <DashboardCard title="Profile Information" icon={<UserCog className="h-6 w-6" />} description="Update your personal and professional details.">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Dr. Alex Johnson" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="alex.johnson@hospital.com" />
            </div>
          </div>
          <div>
            <Label htmlFor="department">Department/Role</Label>
            <Input id="department" defaultValue="Cardiology / Head Surgeon" />
          </div>
          <Button type="submit">Save Profile Changes</Button>
        </form>
      </DashboardCard>

      <DashboardCard title="Emergency Contacts" icon={<UserPlus className="h-6 w-6" />} description="Manage your list of emergency contacts to be notified.">
        <div className="space-y-3 mb-4">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(contact.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddContact} className="space-y-4 p-4 border-t">
          <h3 className="font-semibold">Add New Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" placeholder="e.g., Spouse" value={newContactName} onChange={e => setNewContactName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input id="contactPhone" type="tel" placeholder="e.g., 555-000-0000" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={isAddingContact} className="w-full">
            {isAddingContact ? "Adding..." : "Add Emergency Contact"}
          </Button>
        </form>
      </DashboardCard>

      <DashboardCard title="Notification Preferences" icon={<Bell className="h-6 w-6" />} description="Manage how you receive alerts.">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive updates via email.
              </span>
            </Label>
            <Switch id="emailNotifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="smsNotifications" className="flex flex-col space-y-1">
              <span>SMS Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get critical alerts via SMS.
              </span>
            </Label>
            <Switch id="smsNotifications" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Real-time app alerts.
              </span>
            </Label>
            <Switch id="pushNotifications" defaultChecked />
          </div>
          <Button variant="outline" className="mt-2">Save Notification Settings</Button>
        </div>
      </DashboardCard>

      <DashboardCard title="Security & Password" icon={<Shield className="h-6 w-6" />} description="Manage your account security.">
        <form className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button type="submit">Change Password</Button>
        </form>
      </DashboardCard>
    </div>
  );
}

export default SettingsPage;
