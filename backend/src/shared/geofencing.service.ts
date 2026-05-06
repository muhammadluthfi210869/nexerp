import { Injectable } from '@nestjs/common';

@Injectable()
export class GeofencingService {
  private readonly EARTH_RADIUS_METERS = 6371e3;

  /**
   * Calculates the distance between two points on Earth using the Haversine formula.
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_METERS * c;
  }

  /**
   * Verifies if a point is within a certain radius of another point.
   */
  isWithinRadius(
    pointLat: number,
    pointLon: number,
    centerLat: number,
    centerLon: number,
    radiusMeters: number,
  ): { isWithin: boolean; distance: number } {
    const distance = this.calculateDistance(
      pointLat,
      pointLon,
      centerLat,
      centerLon,
    );
    return {
      isWithin: distance <= radiusMeters,
      distance: Math.round(distance * 100) / 100,
    };
  }
}
