import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectAddressDto } from '../../api/models/project-address-dto';

interface GeoapifyResult {
  lat: number;
  lon: number;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

interface GeoapifyResponse {
  results?: GeoapifyResult[];
}

export interface GeocodedLocation extends ProjectAddressDto {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeoapifyService {
  private readonly http = inject(HttpClient);

  isConfigured(): boolean {
    return !!environment.geoapifyApiKey;
  }

  geocode(address: string): Observable<GeocodedLocation> {
    if (!this.isConfigured()) {
      return throwError(() => new Error('Geoapify API Key fehlt'));
    }

    const params = new HttpParams()
      .set('text', address)
      .set('apiKey', environment.geoapifyApiKey)
      .set('format', 'json')
      .set('limit', '1');

    return this.http
      .get<GeoapifyResponse>('https://api.geoapify.com/v1/geocode/search', {
        params,
      })
      .pipe(map((response) => this.mapResult(response)));
  }

  reverseGeocode(lat: number, lng: number): Observable<GeocodedLocation> {
    if (!this.isConfigured()) {
      return throwError(() => new Error('Geoapify API Key fehlt'));
    }

    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lng.toString())
      .set('apiKey', environment.geoapifyApiKey)
      .set('format', 'json');

    return this.http
      .get<GeoapifyResponse>('https://api.geoapify.com/v1/geocode/reverse', {
        params,
      })
      .pipe(map((response) => this.mapResult(response, lat, lng)));
  }

  private mapResult(response: GeoapifyResponse, lat?: number, lng?: number): GeocodedLocation {
    const result = response.results?.[0];
    if (!result) {
      throw new Error('Kein Ergebnis gefunden');
    }

    return {
      street: result.street ?? '',
      houseNumber: result.housenumber ?? null,
      postalCode: result.postcode ?? '',
      city: result.city ?? '',
      country: result.country ?? '',
      latitude: lat ?? result.lat,
      longitude: lng ?? result.lon,
    };
  }
}
