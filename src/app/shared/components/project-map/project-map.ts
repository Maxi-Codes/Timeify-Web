import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { ProjectAddress } from '../../../api/models/project-address';
import { ProjectAddressDto } from '../../../api/models/project-address-dto';
import { GeoapifyService } from '../../../core/services/geoapify.service';
import {
  buildAddressString,
  DEFAULT_MAP_CENTER,
  hasCoordinates,
} from '../../../core/utils/project-address.util';
import { ButtonComponent } from '../button/button';

const DEFAULT_ZOOM = 14;
const MARKER_ZOOM = 15;

@Component({
  selector: 'app-project-map',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './project-map.html',
})
export class ProjectMapComponent implements AfterViewInit, OnDestroy {
  private readonly geoapify = inject(GeoapifyService);

  readonly = input(false);
  latitude = input<number | null>(null);
  longitude = input<number | null>(null);
  address = input<ProjectAddress | ProjectAddressDto | null>(null);

  latitudeChange = output<number>();
  longitudeChange = output<number>();
  addressChange = output<ProjectAddressDto>();

  readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly mapReady = signal(false);
  readonly mapError = signal('');
  readonly isGeocoding = signal(false);

  private readonly resolvedLatitude = signal<number | null>(null);
  private readonly resolvedLongitude = signal<number | null>(null);

  private readonly displayLatitude = computed(() => this.latitude() ?? this.resolvedLatitude());
  private readonly displayLongitude = computed(() => this.longitude() ?? this.resolvedLongitude());

  private map?: L.Map;
  private marker?: L.Marker;

  constructor() {
    effect(() => {
      const lat = this.displayLatitude();
      const lng = this.displayLongitude();
      if (!this.map) return;
      this.updateMarker(lat, lng);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.resolveLocationOnLoad();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  coordinatesSet(lat: number | null, lng: number | null): boolean {
    return hasCoordinates(lat, lng);
  }

  displayCoordinates(): { lat: number; lng: number } | null {
    const lat = this.displayLatitude();
    const lng = this.displayLongitude();
    if (!hasCoordinates(lat, lng)) return null;
    return { lat: lat!, lng: lng! };
  }

  geocodeAddress(): void {
    const query = buildAddressString(this.address());
    if (!query) {
      this.mapError.set('Bitte zuerst eine Adresse eingeben.');
      return;
    }

    if (!this.geoapify.isConfigured()) {
      this.mapError.set('Geoapify API Key fehlt. Bitte in environment.geoapifyApiKey eintragen.');
      return;
    }

    this.isGeocoding.set(true);
    this.mapError.set('');

    this.geoapify.geocode(query).subscribe({
      next: (result) => {
        this.isGeocoding.set(false);
        this.applyLocation(result, !this.readonly());
      },
      error: () => {
        this.isGeocoding.set(false);
        this.mapError.set('Adresse konnte nicht gefunden werden.');
      },
    });
  }

  private initMap(): void {
    const lat = this.displayLatitude();
    const lng = this.displayLongitude();
    const hasMarker = hasCoordinates(lat, lng);
    const center: L.LatLngExpression = hasMarker
      ? [lat!, lng!]
      : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

    this.map = L.map(this.mapContainer().nativeElement, {
      center,
      zoom: hasMarker ? MARKER_ZOOM : DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.map);

    if (!this.readonly()) {
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        this.onMapLocationSelected(event.latlng.lat, event.latlng.lng);
      });
    }

    if (hasMarker) {
      this.updateMarker(lat, lng);
    }

    this.mapReady.set(true);
    this.refreshMapSize();
  }

  private resolveLocationOnLoad(): void {
    if (hasCoordinates(this.latitude(), this.longitude())) {
      return;
    }

    const query = buildAddressString(this.address());
    if (!query || !this.geoapify.isConfigured()) {
      return;
    }

    this.isGeocoding.set(true);
    this.geoapify.geocode(query).subscribe({
      next: (result) => {
        this.isGeocoding.set(false);

        if (this.readonly()) {
          this.resolvedLatitude.set(result.latitude ?? null);
          this.resolvedLongitude.set(result.longitude ?? null);
          this.updateMarker(result.latitude ?? null, result.longitude ?? null);
          return;
        }

        this.applyLocation(result, true);
      },
      error: () => {
        this.isGeocoding.set(false);
        if (this.readonly()) {
          this.mapError.set('Standort konnte für diese Adresse nicht ermittelt werden.');
        }
      },
    });
  }

  private onMapLocationSelected(lat: number, lng: number): void {
    if (!this.geoapify.isConfigured()) {
      this.latitudeChange.emit(lat);
      this.longitudeChange.emit(lng);
      return;
    }

    this.isGeocoding.set(true);
    this.mapError.set('');

    this.geoapify.reverseGeocode(lat, lng).subscribe({
      next: (result) => {
        this.isGeocoding.set(false);
        this.applyLocation(result, true);
      },
      error: () => {
        this.isGeocoding.set(false);
        this.latitudeChange.emit(lat);
        this.longitudeChange.emit(lng);
      },
    });
  }

  private applyLocation(
    location: ProjectAddressDto & { latitude?: number | null; longitude?: number | null },
    emitAddress: boolean,
  ): void {
    const lat = location.latitude ?? null;
    const lng = location.longitude ?? null;

    if (hasCoordinates(lat, lng)) {
      this.latitudeChange.emit(lat!);
      this.longitudeChange.emit(lng!);
      this.updateMarker(lat, lng);
    }

    if (emitAddress) {
      this.addressChange.emit({
        street: location.street ?? null,
        houseNumber: location.houseNumber ?? null,
        postalCode: location.postalCode ?? null,
        city: location.city ?? null,
        country: location.country ?? null,
        latitude: lat,
        longitude: lng,
      });
    }
  }

  private updateMarker(lat: number | null, lng: number | null): void {
    if (!this.map) return;

    if (!hasCoordinates(lat, lng)) {
      this.marker?.remove();
      this.marker = undefined;
      return;
    }

    const position: L.LatLngExpression = [lat!, lng!];

    if (this.marker) {
      this.marker.setLatLng(position);
    } else {
      this.marker = L.marker(position, { icon: this.createMarkerIcon() }).addTo(this.map);
    }

    this.map.setView(position, MARKER_ZOOM);
    this.refreshMapSize();
  }

  private createMarkerIcon(): L.Icon {
    return L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }

  private refreshMapSize(): void {
    setTimeout(() => this.map?.invalidateSize(), 0);
    setTimeout(() => this.map?.invalidateSize(), 250);
  }
}
