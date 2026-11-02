
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Search, UserCircle, HandCoins } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const mockPatients: { [key: string]: { name: string; story: string; goal: number; raised: number; } } = {
  "PAT-1625081816": {
    name: "Rohan Sharma",
    story: "Rohan was involved in a multi-vehicle accident and requires surgery for a fractured leg. He is the sole provider for his family.",
    goal: 50000,
    raised: 12500,
  },
  "CITIZEN-1721323381014": {
    name: "Anonymous Patient",
    story: "This patient was reported by a Good Samaritan after a fall from a height. They are currently in critical care and funds are needed for ongoing treatment.",
    goal: 150000,
    raised: 35000,
  },
};


const DonationForm = () => (
    <Card className="shadow-lg">
        <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
            <Heart className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl">Support a Patient</CardTitle>
        <CardDescription>
            Your contribution can make a world of difference. Find a patient using their unique ID to donate directly to their medical expenses.
        </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg bg-background">
            <Label htmlFor="patientId" className="font-semibold">Patient ID</Label>
            <div className="flex gap-2 mt-1">
            <Input
                id="patientId"
                placeholder="Enter patient ID (e.g., PAT-1625081816)"
                defaultValue={"PAT-1625081816"}
            />
            <Button>
                <Search className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Find Patient</span>
            </Button>
            </div>
        </div>

        <div className="animate-in fade-in-50 space-y-4">
            <Separator />
            <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                    <UserCircle className="h-6 w-6 text-primary"/>
                    Fundraiser for: {mockPatients["PAT-1625081816"].name}
                </h3>
                <p className="text-sm text-muted-foreground italic mb-3">"{mockPatients["PAT-1625081816"].story}"</p>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-sm">
                        <span className="font-semibold text-primary">
                            Raised: ₹{mockPatients["PAT-1625081816"].raised.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                            Goal: ₹{mockPatients["PAT-1625081816"].goal.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${(mockPatients["PAT-1625081816"].raised / mockPatients["PAT-1625081816"].goal) * 100}%`}}
                        ></div>
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    <Label htmlFor="donationAmount" className="font-semibold text-lg flex items-center gap-2">
                        <HandCoins className="h-5 w-5"/>
                        Your Donation
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="donationAmount"
                            type="number"
                            placeholder="Enter amount in INR"
                        />
                        <Button size="lg" className="w-48">
                            Donate Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </CardContent>
    </Card>
);

export default function DonatePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8 md:py-12 bg-muted/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <DonationForm />
        </div>
      </main>
    </div>
  );
}
