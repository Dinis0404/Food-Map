/** 地點搜尋結果（Photon / Nominatim 統一格式） */
export type PlaceCandidate = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  osmId?: string;
};
