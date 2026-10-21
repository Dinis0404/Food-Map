"use client";

import MapView from "./MapView";
import type { MapPoint } from "./MapView";

export default function MiniMapView({
  lat,
  lng,
  name,
  height = 240,
}: {
  lat: number;
  lng: number;
  name: string;
  height?: number;
}) {
  const points: MapPoint[] = [{ id: "restaurant", name, lat, lng }];
  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-200" style={{ height }}>
      <MapView points={points} className="h-full w-full" />
    </div>
  );
}
