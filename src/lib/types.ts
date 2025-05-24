
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type MarketplaceListing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type GeneratedDescription = Database["public"]["Tables"]["generated_descriptions"]["Row"];
export type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

export interface MarketplaceListingWithProduct extends MarketplaceListing {
  product: Product;
}

export interface SaleWithProductAndListing extends Sale {
  product: Product;
  marketplace_listing: MarketplaceListing | null;
}

export interface GeneratedDescriptionWithProduct extends GeneratedDescription {
  product?: Product;
}

export type UserRole = 'user' | 'admin';

export interface ProfileWithRole extends Profile {
  role: UserRole;
}
