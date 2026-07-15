export type UserRole = "admin" | "health_unit" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unitId?: string;
}

export type UnitCategory =
  | "hospital"
  | "clinic"
  | "pharmacy"
  | "upa"
  | "laboratory";

export interface Professional {
  id: string;
  name: string;
  role: "doctor" | "pharmacist" | "nurse";
  specialty?: string;
  crm?: string;
  crf?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  locationCorrect?: boolean;
}

export interface HealthUnit {
  id: string;
  name: string;
  category: UnitCategory;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  hours: string;
  specialties: string[];
  professionals: Professional[];
  reviews: Review[];
  rating: number;
  totalReviews: number;
  approved: boolean;
  locationVerified: boolean;
  locationVotes: number;
  imageUrl?: string;
}

export interface FilterState {
  category: UnitCategory | "all";
  specialty: string;
  maxDistance: number;
  searchQuery: string;
}
