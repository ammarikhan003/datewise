// Shapes of the Rails API's JSON. Field names match the API (snake_case).

export interface Product {
  slug: string;
  name: string;
  price_pence: number;
  lead_time_days: number;
  in_stock: boolean;
  image_url: string | null;
}

/** Why a date can't be booked; matches AvailabilityCalculator's reasons. */
export type UnavailableReason =
  | 'past'
  | 'after_cutoff'
  | 'closed'
  | 'fully_booked'
  | 'lead_time'
  | 'out_of_stock'
  | 'too_far';

export interface AvailabilityDate {
  /** YYYY-MM-DD */
  date: string;
  available: boolean;
  reason: UnavailableReason | null;
}

export interface AvailabilityResponse {
  product: string;
  from: string;
  to: string;
  dates: AvailabilityDate[];
}

export interface OrderRequest {
  product_slug: string;
  /** YYYY-MM-DD */
  delivery_date: string;
  customer_name: string;
  email: string;
  address: string;
}

export interface Order {
  id: number;
  delivery_date: string;
  status: 'confirmed';
  customer_name: string;
  email: string;
  address: string;
  created_at: string;
  product: Pick<Product, 'slug' | 'name' | 'price_pence'>;
}

/** 422 bodies from POST /api/orders. */
export type OrderError =
  | { error: 'unavailable'; reason: UnavailableReason }
  | { error: 'invalid'; details: Partial<Record<keyof OrderRequest, string[]>> };

export interface AdminDay {
  date: string;
  capacity: number;
  booked: number;
  closed: boolean;
  closed_reason: string | null;
  bank_holiday: string | null;
}

export interface DayChanges {
  closed?: boolean;
  closed_reason?: string | null;
  capacity?: number;
}
