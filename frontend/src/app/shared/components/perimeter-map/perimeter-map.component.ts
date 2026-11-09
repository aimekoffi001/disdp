import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, model, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { APP_SETTINGS } from '../../../core/config/app-settings';
import { LatLng } from '../../../core/models/models';
import { DroneService } from '../../../core/services/drone.service';
import { fmtArea, polygonAreaM2 } from '../../utils/geo';
import { IconComponent } from '../icon/icon.component';

const COLORS = ['#38BDF8', '#34D399', '#F59E0B', '#818CF8', '#F87171'];

/** Carte de planification : position GPS du drone en direct + tracé de périmètres de délimitation. */
@Component({
  selector: 'app-perimeter-map',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        @if (!drawing()) {
          <button type="button" class="btn-pill" (click)="startDrawing()"><app-icon name="pencil" [size]="12" /> Tracer un périmètre</button>
        } @else {
          <button type="button" class="btn-pill !bg-[#10B981]" [disabled]="draftCount() < 3" (click)="finish()">Terminer ({{ draftCount() }} pts)</button>
          <button type="button" class="btn-ghost" [disabled]="draftCount() === 0" (click)="undoPoint()">Annuler le dernier point</button>
          <button type="button" class="btn-ghost" (click)="cancelDrawing()">Abandonner</button>
        }
        <button type="button" class="btn-ghost" (click)="centerOnDrone()"><app-icon name="pin" [size]="12" /> Centrer sur le drone</button>
        @if (perimeters().length) { <button type="button" class="btn-ghost hover:!text-[#F87171]" (click)="clearAll()">Tout effacer</button> }
      </div>

      <div class="relative overflow-hidden rounded-[12px] border border-[#1E3A5F] shadow-md" [style.height.px]="height()">
        <div #mapEl class="absolute inset-0"></div>
        <div class="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-lg border border-[#1E3A5F] bg-[#0A192F]/95 px-2.5 py-1.5 text-[10px] shadow-lg backdrop-blur">
          @if (drone(); as d) {
            <div class="flex items-center gap-1.5 font-semibold text-[#F8FAFC]"><span class="size-1.5 animate-pulse rounded-full bg-[#34D399]"></span>GPS · {{ d.name }}</div>
            <div class="text-[#94A3B8] tabular-nums">{{ d.latitude.toFixed(5) }}, {{ d.longitude.toFixed(5) }}</div>
          } @else { <span class="text-[#94A3B8]">Choisissez un drone pour le localiser.</span> }
        </div>
        @if (drawing()) {
          <div class="pointer-events-none absolute right-2 bottom-2 left-2 z-[500] rounded-lg bg-[#2563EB] px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-xl">
            Cliquez sur la carte pour placer les sommets. Cliquez sur le premier point (ou « Terminer ») pour fermer le périmètre.
          </div>
        }
      </div>

      @if (perimeters().length) {
        <ul class="flex flex-wrap gap-1.5">
          @for (p of perimeters(); track $index; let i = $index) {
            <li class="flex items-center gap-2 rounded-full border border-[#1E3A5F] bg-[#0C1E3D] py-1 pr-1 pl-2.5 text-[11px] font-medium text-[#F8FAFC] shadow-sm">
              <span class="size-2 rounded-full" [style.background]="color(i)"></span>
              Périmètre {{ i + 1 }} · {{ p.length }} pts · {{ area(p) }}
              <button type="button" class="icon-btn !size-5 hover:!text-[#F87171]" [attr.aria-label]="'Supprimer le périmètre ' + (i + 1)" (click)="remove(i)"><app-icon name="x" [size]="11" /></button>
            </li>
          }
        </ul>
      } @else {
        <p class="text-[11px] text-[#94A3B8]">Aucun périmètre tracé (optionnel).</p>
      }
    </div>
  `,
})
export class PerimeterMapComponent {
  readonly droneId = input('');
  readonly height = input(300);
  readonly perimeters = model<LatLng[][]>([]);

  private readonly drones = inject(DroneService);
  protected readonly drone = computed(() => this.drones.byId(this.droneId()));
  protected readonly drawing = signal(false);
  protected readonly draftCount = signal(0);

  private readonly mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private map?: L.Map;
  private resizeObserver?: ResizeObserver;
  private droneMarker?: L.Marker;
  private polygons: L.Polygon[] = [];
  private draft: LatLng[] = [];
  private draftLine?: L.Polyline;
  private draftDots: L.CircleMarker[] = [];
  private centered = false;

  constructor() {
    afterNextRender(() => {
      this.init();
      this.drawPerimeters();
      this.updateDrone();
    });
    effect(() => {
      this.perimeters();
      if (this.map) this.drawPerimeters();
    });
    effect(() => {
      this.drone();
      if (this.map) this.updateDrone();
    });
    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.map?.remove();
      this.map = undefined;
    });
  }

  protected color(i: number): string {
    return COLORS[i % COLORS.length];
  }
  protected area(p: LatLng[]): string {
    return fmtArea(polygonAreaM2(p));
  }

  // ---- tracé
  protected startDrawing(): void {
    this.drawing.set(true);
    this.map?.getContainer().classList.add('drawing');
    this.map?.doubleClickZoom.disable();
  }
  protected cancelDrawing(): void {
    this.resetDraft();
    this.drawing.set(false);
    this.map?.getContainer().classList.remove('drawing');
    this.map?.doubleClickZoom.enable();
  }
  protected undoPoint(): void {
    this.draft.pop();
    this.redrawDraft();
  }
  protected finish(): void {
    if (this.draft.length < 3) return;
    this.perimeters.update((l) => [...l, this.draft.map(([a, b]) => [a, b] as LatLng)]);
    this.cancelDrawing();
  }
  protected remove(i: number): void {
    this.perimeters.update((l) => l.filter((_, k) => k !== i));
  }
  protected clearAll(): void {
    this.perimeters.set([]);
  }
  protected centerOnDrone(): void {
    const d = this.drone();
    if (d && this.map) this.map.setView([d.latitude, d.longitude], Math.max(this.map.getZoom(), 17));
  }

  // ---- carte
  private init(): void {
    const el = this.mapEl().nativeElement;
    const d = this.drone();
    const start: L.LatLngTuple = d ? [d.latitude, d.longitude] : [APP_SETTINGS.baseLat, APP_SETTINGS.baseLng];
    this.map = L.map(el).setView(start, 17);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.drawing()) return;
      this.draft.push([e.latlng.lat, e.latlng.lng]);
      this.redrawDraft();
    });
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(el);
  }

  private redrawDraft(): void {
    const map = this.map;
    if (!map) return;
    this.draftDots.forEach((m) => m.remove());
    this.draftDots = [];
    this.draftLine?.remove();
    this.draftCount.set(this.draft.length);
    this.draftLine = L.polyline(this.draft, { color: '#38BDF8', weight: 3, dashArray: '6 4' }).addTo(map);
    this.draft.forEach((pt, i) => {
      const dot = L.circleMarker(pt, { radius: i === 0 ? 8 : 5, color: '#fff', weight: 2, fillColor: '#38BDF8', fillOpacity: 1 }).addTo(map);
      if (i === 0 && this.draft.length >= 3) dot.on('click', (ev) => { L.DomEvent.stopPropagation(ev); this.finish(); });
      this.draftDots.push(dot);
    });
  }

  private resetDraft(): void {
    this.draft = [];
    this.redrawDraft();
  }

  private drawPerimeters(): void {
    const map = this.map;
    if (!map) return;
    this.polygons.forEach((p) => p.remove());
    this.polygons = this.perimeters().map((poly, i) =>
      L.polygon(poly, { color: this.color(i), weight: 2, fillOpacity: 0.22 }).bindTooltip(`Périmètre ${i + 1} · ${this.area(poly)}`, { sticky: true }).addTo(map),
    );
    if (this.polygons.length && !this.centered) {
      this.centered = true;
      map.fitBounds(L.featureGroup(this.polygons).getBounds().pad(0.3));
    }
  }

  private updateDrone(): void {
    const map = this.map;
    if (!map) return;
    const d = this.drone();
    if (!d) { this.droneMarker?.remove(); this.droneMarker = undefined; return; }
    const pos: L.LatLngTuple = [d.latitude, d.longitude];
    const icon = L.divIcon({ html: '<div class="drone-pin selected" style="background:#38BDF8">✈</div>', className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
    if (!this.droneMarker) this.droneMarker = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
    else this.droneMarker.setLatLng(pos);
    this.droneMarker.bindTooltip(`${d.name} — position GPS`);
    if (!this.perimeters().length && !this.centered) { this.centered = true; map.setView(pos, 17); }
  }
}
