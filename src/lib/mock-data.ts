
// Centralized mock data for consistent use across dashboards.

export const MOCK_HOSPITALS = [
  { 
    id: "hospital-1", 
    name: "City General Hospital", 
    location: { latitude: 17.4486, longitude: 78.3908 },
    specialties: ["Trauma Surgery", "Orthopedics", "General Surgery", "Radiology", "Emergency Medicine"],
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500081"
  },
  { 
    id: "hospital-2", 
    name: "Metro Health Center", 
    location: { latitude: 17.4065, longitude: 78.4772 },
    specialties: ["Cardiology", "Internal Medicine", "Pediatrics", "Emergency Medicine"],
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500004"
  },
  { 
    id: "hospital-3", 
    name: "St. Jude's Medical", 
    location: { latitude: 17.4239, longitude: 78.4483 },
    specialties: ["Neurology / Neurosurgery", "Oncology", "Radiology", "Anesthesiology"],
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500082"
  },
  {
    id: "hospital-4",
    name: "Sunshine Hospitals",
    location: { latitude: 17.4230, longitude: 78.4230 },
    specialties: ["Orthopedics", "Cardiology", "Trauma Surgery"],
    district: "Secunderabad",
    state: "Telangana",
    pincode: "500003"
  },
  {
    id: "hospital-5",
    name: "Apollo Hospital Jubilee Hills",
    location: { latitude: 17.4202, longitude: 78.4013 },
    specialties: ["Multi-Specialty", "Trauma Surgery", "Cardiology", "Neurology / Neurosurgery"],
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500033"
  }
];

export const MOCK_STAFF = [
  { id: "staff1", name: "Dr. Emily Carter", specialty: "Cardiology", status: "On-call", avatar: "https://i.pravatar.cc/40?u=staff1" },
  { id: "staff2", name: "Dr. Ben Adams", specialty: "Neurology", status: "Available", avatar: "https://i.pravatar.cc/40?u=staff2" },
  { id: "staff3", name: "Dr. Chloe Davis", specialty: "Orthopedics", status: "In Surgery", avatar: "https://i.pravatar.cc/40?u=staff3" },
  { id: "staff4", name: "Nurse Ryan Harris", specialty: "Emergency Nurse", status: "Available", avatar: "https://i.pravatar.cc/40?u=staff4" },
];

export const MOCK_INVENTORY = [
  { id: "item1", name: "Surgical Kits", category: "Surgical", quantity: 62, status: "In Stock" },
  { id: "item2", name: "Ventilators", category: "Equipment", quantity: 15, status: "In Use" },
  { id: "item3", name: "Blood Supply (O-)", category: "Blood Bank", quantity: 8, status: "Low Stock" },
  { id: "item4", name: "Ibuprofen 500mg", category: "Pharmacy", quantity: 500, status: "In Stock" },
];

export const MOCK_HOSPITAL_DATA = {
    staffing: ["Trauma Surgeon", "ER Physician", "Anesthesiologist", "Radiologist"],
    inventory: ["O- Blood: Low", "Ventilators: 5 available", "Surgical Kits: Ample", "IV Fluids: Ample"]
};
