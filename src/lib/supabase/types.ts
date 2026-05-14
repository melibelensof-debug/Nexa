/**
 * Tipos manuales de las tablas. Para algo más completo se puede generar con
 * `supabase gen types typescript --project-id <ref>`, pero esto alcanza.
 */
export type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviews_count: number | null;
  hours: string | null;
  image_url: string | null;
  source: string | null;
  external_id: string | null;
  category_id: string;
  region_id: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

export type RegionRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type GeocodeCacheRow = {
  id: string;
  query: string;
  latitude: number;
  longitude: number;
  display: string | null;
  created_at: string;
};

/**
 * Para Insert/Update aceptamos cualquier subset razonable de columnas.
 * La DB se encarga de defaults y validación.
 */
type InsertOf<T> = Partial<T> & { [k: string]: unknown };

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow;
        Insert: InsertOf<BusinessRow>;
        Update: Partial<BusinessRow>;
      };
      categories: {
        Row: CategoryRow;
        Insert: InsertOf<CategoryRow>;
        Update: Partial<CategoryRow>;
      };
      regions: {
        Row: RegionRow;
        Insert: InsertOf<RegionRow>;
        Update: Partial<RegionRow>;
      };
      geocode_cache: {
        Row: GeocodeCacheRow;
        Insert: InsertOf<GeocodeCacheRow>;
        Update: Partial<GeocodeCacheRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
