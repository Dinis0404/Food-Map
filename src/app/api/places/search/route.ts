import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_CENTER } from "@/lib/constants";
import type { PlaceCandidate } from "@/lib/types";

/** Photon（komoot）地點搜尋，無結果或失敗就 fallback 去 Nominatim */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const lat = Number(sp.get("lat")) || DEFAULT_CENTER.lat;
  const lon = Number(sp.get("lon")) || DEFAULT_CENTER.lng;

  if (!q || q.length < 2) {
    return NextResponse.json({ source: "none", results: [] });
  }

  // 1) Photon：對 POI（餐廳、咖啡店等）索引較好
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&limit=8`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) },
    );
    if (res.ok) {
      const data = await res.json();
      const results: PlaceCandidate[] = (data.features ?? [])
        .filter((f: { properties?: { name?: string } }) => f.properties?.name)
        .map((f: {
          properties: {
            osm_type?: string;
            osm_id?: number;
            name: string;
            housenumber?: string;
            street?: string;
            district?: string;
            city?: string;
            state?: string;
            country?: string;
          };
          geometry: { coordinates: [number, number] };
        }) => {
          const p = f.properties;
          const streetLine =
            p.housenumber && p.street ? `${p.street} ${p.housenumber}` : p.street;
          const address = [streetLine, p.district, p.city, p.state, p.country]
            .filter(Boolean)
            .join(", ");
          const osmId =
            p.osm_type && p.osm_id ? `${p.osm_type.toUpperCase()}${p.osm_id}` : undefined;
          return {
            id: osmId ?? `${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}`,
            name: p.name,
            address: address || undefined,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            osmId,
          };
        });
      if (results.length > 0) {
        return NextResponse.json({ source: "photon", results });
      }
    }
  } catch {
    // 落去試 Nominatim
  }

  // 2) Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=8&accept-language=zh-HK,en&addressdetails=1`,
      {
        headers: { "User-Agent": "food-journal-map/0.1 (personal use)" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        osm_type?: string;
        osm_id?: number;
        name?: string;
        display_name: string;
        lat: string;
        lon: string;
      }[];
      const results: PlaceCandidate[] = data.map((x, i) => {
        const osmId = x.osm_type && x.osm_id ? `${x.osm_type.toUpperCase()}${x.osm_id}` : undefined;
        return {
          id: osmId ?? `nom${i}`,
          name: x.name || x.display_name.split(",")[0],
          address: x.display_name,
          lat: Number(x.lat),
          lng: Number(x.lon),
          osmId,
        };
      });
      return NextResponse.json({ source: "nominatim", results });
    }
  } catch {
    // 兩個 geocoder 都唔通：當作無結果
  }

  return NextResponse.json({ source: "none", results: [] });
}
