// Mirrors the Prisma schema — avoids import issues across Prisma major versions
export interface Agent {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  avgRating: number;
  totalReviews: number;
  createdAt: Date;
}

export interface Review {
  id: string;
  agentId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
