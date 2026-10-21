"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./LeafletMap";

export type { MapPoint };

function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-200 text-sm text-stone-500">
      載入地圖中…
    </div>
  );
}

/**
 * Leaflet 只能在瀏覽器執行，統一透過此包裝以 ssr:false 動態載入；
 * 其他地方請勿直接 import LeafletMap。
 */
const LeafletMapView = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: Loading,
});

const LeafletPickerMap = dynamic(
  () => import("./LeafletMap").then((m) => ({ default: m.PickerMap })),
  { ssr: false, loading: Loading },
);

type MapViewProps = {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

export default function MapView(props: MapViewProps) {
  return <LeafletMapView {...props} />;
}

type PickerMapProps = {
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: number;
  onChange: (lat: number, lng: number) => void;
};

export function PickerMap(props: PickerMapProps) {
  return <LeafletPickerMap {...props} />;
}
