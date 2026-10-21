"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";

export type MapPoint = { id: string; name: string; lat: number; lng: number };

function makePinIcon(selected: boolean) {
  return L.divIcon({
    className: "fm-pin",
    html: `<div class="fm-pin-inner${selected ? " fm-pin-selected" : ""}">🍴</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

function TileLayerOSM() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

/** points 變化時自動縮放到包含所有 pin */
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 16);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [points, map]);
  return null;
}

/** 座標變化時重新置中（選定地點後使用） */
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom());
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type MapViewProps = {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

/** 純展示地圖：一次顯示多個 pin */
export default function MapView({
  points,
  selectedId,
  onSelect,
  className,
}: MapViewProps) {
  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
    >
      <TileLayerOSM />
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makePinIcon(p.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Popup>{p.name}</Popup>
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}

type PickerMapProps = {
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: number;
  /** 地圖點擊或 marker 拖曳後回傳新座標 */
  onChange: (lat: number, lng: number) => void;
};

/** 定位用小地圖：點擊放 pin，pin 可拖曳微調 */
export function PickerMap({ lat, lng, zoom, height = 240, onChange }: PickerMapProps) {
  const hasPoint = lat != null && lng != null;
  const center: [number, number] = hasPoint
    ? [lat as number, lng as number]
    : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  return (
    <MapContainer
      center={center}
      zoom={zoom ?? (hasPoint ? 16 : DEFAULT_ZOOM)}
      scrollWheelZoom
      className="w-full rounded-lg"
      style={{ height }}
    >
      <TileLayerOSM />
      <ClickCatcher onPick={onChange} />
      {hasPoint && (
        <Marker
          position={[lat as number, lng as number]}
          draggable
          icon={makePinIcon(true)}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onChange(ll.lat, ll.lng);
            },
          }}
        />
      )}
      {hasPoint && <Recenter lat={lat as number} lng={lng as number} zoom={zoom} />}
    </MapContainer>
  );
}
