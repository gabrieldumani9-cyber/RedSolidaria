import {
  Component, AfterViewInit, ElementRef, input, output, viewChild,
  OnDestroy, OnChanges, SimpleChanges,
} from '@angular/core';
import * as L from 'leaflet';
import { Solicitud, URGENCIA_META, CATEGORIA_META } from '../models/models';

@Component({
  selector: 'app-map',
  template: `<div #mapEl class="map-container"></div>`,
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private selectionMarker: L.Marker | null = null;
  private userMarker: L.Marker | null = null;
  private mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');

  solicitudes = input<Solicitud[]>([]);
  selectable = input<boolean>(false);
  center = input<{ lat: number; lng: number } | null>(null);
  selectedLocation = input<{ lat: number; lng: number } | null>(null);
  userLocation = input<{ lat: number; lng: number } | null>(null);

  onMarkerClick = output<Solicitud>();
  onMapClick = output<{ lat: number; lng: number }>();

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl().nativeElement, {
      center: [40.4168, -3.7038],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    setTimeout(() => this.map.invalidateSize(), 100);
    this.renderMarkers();
    this.renderSelection();
    this.renderUserLocation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['solicitudes']) {
      this.renderMarkers();
    }
    if (changes['selectedLocation']) {
      this.renderSelection();
    }
    if (changes['userLocation']) {
      this.renderUserLocation();
    }
    if (changes['center'] && this.center()) {
      const c = this.center()!;
      this.map.setView([c.lat, c.lng], Math.max(this.map.getZoom(), 14), {
        animate: true,
      });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  private renderMarkers(): void {
    if (!this.map) return;
    this.markers.forEach((m) => m.remove());
    this.markers = [];

    for (const s of this.solicitudes()) {
      const isResolved = s.estado === 'resuelta';
      const urg = URGENCIA_META[s.urgencia];
      const cat = CATEGORIA_META[s.categoria];
      const pinColor = isResolved ? '#16a34a' : urg.marker;
      const pulse = s.urgencia === 'Alta' && !isResolved ? 'rs-pin-urgent' : '';
      const checkIcon = isResolved ? '✓' : cat.emoji;
      const html = `<div class="rs-pin ${pulse}" style="background:${pinColor}">
        <div class="rs-pin-inner">${checkIcon}</div>
      </div>`;
      const icon = L.divIcon({
        html,
        className: 'rs-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([s.lat, s.lng], { icon }).addTo(this.map);
      marker.on('click', () => this.onMarkerClick.emit(s));
      this.markers.push(marker);
    }
  }

  private renderUserLocation(): void {
    if (!this.map) return;
    this.userMarker?.remove();
    this.userMarker = null;
    const loc = this.userLocation();
    if (!loc) return;
    const html = `<div class="rs-user-location"><span></span></div>`;
    const icon = L.divIcon({
      html,
      className: 'rs-user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    this.userMarker = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 1000 })
      .bindTooltip('Tú estás aquí', { direction: 'top', offset: [0, -10] })
      .addTo(this.map);
  }

  private renderSelection(): void {
    if (!this.map) return;
    if (this.selectionMarker) {
      this.selectionMarker.remove();
      this.selectionMarker = null;
    }
    const loc = this.selectedLocation();
    if (loc) {
      const html = `<div class="rs-pin rs-pin-select" style="background:#16a34a">
        <div class="rs-pin-inner">📍</div>
      </div>`;
      const icon = L.divIcon({
        html,
        className: 'rs-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      this.selectionMarker = L.marker([loc.lat, loc.lng], { icon }).addTo(this.map);
    }
  }
}
