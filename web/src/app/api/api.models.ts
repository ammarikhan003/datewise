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
