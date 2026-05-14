/**
 * Cliente mínimo para la API sincrónica de Apify.
 * Docs: https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items
 *
 * Usamos run-sync-get-dataset-items para devolver el resultado en una sola llamada.
 * Para datasets grandes conviene usar runs asíncronos + webhook, pero para este caso alcanza.
 */

const BASE = "https://api.apify.com/v2";

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN no configurado en .env");
  return t;
}

export type ApifyRunOptions = {
  /** Tiempo máximo en segundos para que el actor corra. */
  timeoutSecs?: number;
  /** Memoria asignada al run (MB). */
  memoryMbytes?: number;
};

export async function runActorSync<TInput, TItem = unknown>(
  actorId: string,
  input: TInput,
  options: ApifyRunOptions = {}
): Promise<TItem[]> {
  const params = new URLSearchParams({ token: token() });
  if (options.timeoutSecs) params.set("timeout", String(options.timeoutSecs));
  if (options.memoryMbytes) params.set("memory", String(options.memoryMbytes));

  // El path acepta el actor con "/" reemplazado por "~"
  const path = actorId.replace("/", "~");
  const url = `${BASE}/acts/${path}/run-sync-get-dataset-items?${params}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify ${actorId} respondió ${res.status}: ${text.slice(0, 300)}`);
  }

  return (await res.json()) as TItem[];
}

// ----- Tipos parciales esperados por scraper -----

export type GMapsItem = {
  title?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  url?: string;
  placeId?: string;
  totalScore?: number;
  reviewsCount?: number;
  location?: { lat: number; lng: number };
  description?: string;
  imageUrl?: string;
  openingHours?: { day: string; hours: string }[];
};

export type InstagramItem = {
  username?: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  profilePicUrl?: string;
  businessCategoryName?: string;
  businessAddressJson?: string;
  businessEmail?: string;
  businessPhoneNumber?: string;
};

export type FacebookItem = {
  pageName?: string;
  title?: string;
  pageUrl?: string;
  intro?: string;
  about?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  profilePhoto?: string;
};
