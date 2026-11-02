
"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PackagePlus, Warehouse, Syringe, Droplets, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { useFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
};

function InventoryPage() {
  const { toast } = useToast();
  const db = useFirebaseDb();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!db) return;
    setIsFetching(true);
    
    const q = query(collection(db, "inventory"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setInventory(inventoryData);
      setIsFetching(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      toast({ variant: "destructive", title: "Failed to fetch inventory", description: "Could not load inventory data from the database." });
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [db, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !category || !quantity) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields to add a new inventory item.",
      });
      return;
    }
     if (!db) {
        toast({ variant: "destructive", title: "Database Error", description: "Firestore is not available."});
        return;
    }

    setIsLoading(true);
    const parsedQuantity = parseInt(quantity, 10);
    const newItemData = {
      name: itemName,
      category,
      quantity: parsedQuantity,
      status: parsedQuantity > 20 ? "In Stock" : parsedQuantity > 0 ? "Low Stock" : "Out of Stock",
    };

    try {
      await addDoc(collection(db, "inventory"), newItemData);
      toast({
        title: "Item Added Successfully",
        description: `${itemName} has been added to the inventory.`,
      });
      // Reset form
      setItemName("");
      setCategory("");
      setQuantity("");
    } catch (error) {
        console.error("Error adding inventory item:", error);
        toast({ variant: "destructive", title: "Failed to add item", description: "An error occurred while saving the item to the database." });
    } finally {
        setIsLoading(false);
    }
  };
  
  const getIconForCategory = (category: string) => {
    switch(category) {
        case 'Surgical': return <Syringe className="h-5 w-5 text-muted-foreground" />;
        case 'Equipment': return <ShieldCheck className="h-5 w-5 text-muted-foreground" />;
        case 'Blood Bank': return <Droplets className="h-5 w-5 text-muted-foreground" />;
        case 'Pharmacy': return <Syringe className="h-5 w-5 text-muted-foreground" />;
        default: return <Warehouse className="h-5 w-5 text-muted-foreground" />;
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Stock': return 'default';
      case 'Low Stock': return 'secondary';
      case 'Out of Stock': return 'destructive';
      case 'In Use': return 'outline';
      default: return 'default';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Hospital Inventory</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <DashboardCard 
            title="Add New Item" 
            icon={<PackagePlus className="h-6 w-6" />} 
            description="Add a new item to the hospital's inventory."
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input 
                  id="itemName" 
                  placeholder="e.g., Normal Saline IV Bags" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Surgical">Surgical</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Blood Bank">Blood Bank</SelectItem>
                    <SelectItem value="General Supply">General Supply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  placeholder="e.g., 100" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !db}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding Item...</> : "Add to Inventory"}
              </Button>
            </form>
          </DashboardCard>
        </div>

        <div className="md:col-span-2">
            <DashboardCard title="Current Inventory" icon={<Warehouse className="h-6 w-6" />} description="A live look at all items in the inventory.">
                {isFetching ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading inventory...</span>
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    {getIconForCategory(item.category)}
                                    {item.name}
                                </TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={getStatusVariant(item.status)} className={item.status === 'In Stock' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
                 {(!isFetching && inventory.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground p-4">No inventory items found.</p>
                )}
            </DashboardCard>
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;
