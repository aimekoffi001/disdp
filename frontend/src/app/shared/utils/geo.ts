import { LatLng } from '../../core/models/models';

/** Point dans polygone (ray casting, coordonnées [lat, lng]). */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [y, x] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Surface approximative en m² (projection équirectangulaire locale). */
export function polygonAreaM2(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;
  const lat0 = (polygon[0][0] * Math.PI) / 180;
  const pts = polygon.map(([lat, lng]) => [lng * 111320 * Math.cos(lat0), lat * 110540] as const);
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function fmtArea(m2: number): string {
  return m2 >= 10_000 ? `${(m2 / 10_000).toFixed(2).replace('.', ',')} ha` : `${Math.round(m2)} m²`;
}
