import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private nominatim = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<GeocodeResult[]> {
    const url = `${this.nominatim}/search`;
    const params = {
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      'accept-language': 'es',
    };
    return this.http.get<any[]>(url, { params }).pipe(
      map((arr) => (arr || []).map((r) => ({
        displayName: r.display_name as string,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }))),
    );
  }

  reverse(lat: number, lng: number): Observable<ReverseGeocodeResult> {
    const url = `${this.nominatim}/reverse`;
    const params = {
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      'accept-language': 'es',
      zoom: '18',
    };
    return this.http.get<any>(url, { params }).pipe(
      map((r) => ({ displayName: (r.display_name as string) || '' })),
    );
  }
}
