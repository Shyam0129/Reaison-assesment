// Centralized API response shape for consistency across all endpoints
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

// Pagination metadata returned alongside list results
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
