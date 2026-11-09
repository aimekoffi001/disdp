import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { APP_SETTINGS } from '../../../../core/config/app-settings';
import { Drone, LatLng, SurveillanceZone } from '../../../../core/models/models';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { FlightControlService } from '../../../../core/services/flight-control.service';
import { FlightService } from '../../../../core/services/flight.service';
import { ZoneService } from '../../../../core/services/zone.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DRONE_STATUS, FLIGHT_MODE, fmtDistance } from '../../../../shared/utils/labels';

export const DRONE_COLORS = ['#38BDF8', '#34D399', '#F59E0B', '#818CF8', '#F87171', '#94A3B8'];
const MAX_TRAIL = 120;

@Component({
  selector: 'app-drone-map',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel flex h-full flex-col">
      <div class="panel-title flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <app-icon name="map" [size]="14" class="text-[#38BDF8]" />
          <span class="text-[#F8FAFC] font-semibold">Carte Tactique & Drones en Temps Réel</span>
          <span class="flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-0.5 text-[9px] font-semibold tracking-normal text-[#34D399] normal-case shadow-xs">
            <span class="size-1.5 rounded-full bg-[#10B981] animate-pulse"></span><span class="hidden sm:inline">Temps réel · </span>{{ updated() }}
          </span>
          @if (selectedDrone(); as sel) {
            @if (sel.status === 'in-flight') {
              <span class="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/40 bg-[#0C1E3D] px-2.5 py-0.5 text-[10px] font-semibold text-[#38BDF8]">
                <span>{{ sel.speed.toFixed(1) }} m/s</span>
                <span class="text-[#94A3B8]">·</span>
                <span class="text-[#34D399]">Dist: {{ fmtDist(sel.distanceKm) }}</span>
                <span class="text-[#38BDF8] text-[9px]">(+{{ Math.round(sel.speed) }} m/s)</span>
              </span>
            }
          }
        </div>
        @if (controls()) {
          <span class="flex flex-wrap gap-1.5 ml-auto sm:ml-0">
            <button type="button" 
                    class="btn-ghost !border-[#F59E0B]/40 !bg-[#172A4D] !text-[#FBBF24] hover:!bg-[#1E3A5F]"
                    (click)="planSafeRTH()" 
                    title="Planifier le retour à la base sécurisé de toute la flotte (Séparation verticale étagée)">
              <app-icon name="schedule" [size]="12" /> <span class="hidden sm:inline">RTH Anti-Collision</span><span class="sm:hidden">RTH</span>
            </button>
            <button type="button" [class]="'btn-ghost ' + (follow() ? '!border-[#38BDF8] !bg-[#172A4D] !text-[#38BDF8]' : '')" [attr.aria-pressed]="follow()" (click)="follow.set(!follow())">
              <app-icon name="pin" [size]="12" /> <span class="hidden sm:inline">Suivre le drone</span><span class="sm:hidden">Suivre</span>
            </button>
            <button type="button" class="btn-ghost" (click)="fitFleet()">
              <app-icon name="maximize" [size]="12" /> <span class="hidden sm:inline">Vue d'ensemble</span><span class="sm:hidden">Flotte</span>
            </button>
          </span>
        }
      </div>

      <!-- Barre d'outils interactive : Sélection & Tracé du Périmètre de Survol en Temps Réel -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] px-3 py-2 text-xs">
        <div class="flex flex-wrap items-center gap-1.5 min-w-0">
          <span class="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] mr-1 flex items-center gap-1 shrink-0">
            <app-icon name="route" [size]="12" class="text-[#38BDF8]" />
            Survol en temps réel :
          </span>
          @for (z of zones(); track z.id) {
            <button type="button" 
                    (click)="selectZone(z)"
                    [class]="'rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition cursor-pointer ' + 
                            (selectedDrone()?.assignedZoneName === z.name 
                              ? 'border-[#38BDF8] bg-[#172A4D] text-[#38BDF8] shadow-sm' 
                              : 'border-[#1E3A5F] bg-[#112240] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172A4D]')">
              📍 {{ z.name }}
            </button>
          }
        </div>

        <div class="flex items-center gap-1.5 ml-auto">
          @if (!drawingPerimeter()) {
            <button type="button" 
                    (click)="startDrawing()" 
                    class="btn-ghost !border-[#38BDF8]/40 !bg-[#172A4D] !text-[#38BDF8] hover:!bg-[#1E3A5F] cursor-pointer">
              <app-icon name="pencil" [size]="12" /> Tracer un périmètre
            </button>
          } @else {
            <button type="button" 
                    (click)="finishDrawing()" 
                    [disabled]="draftPoints().length < 3"
                    class="btn-pill !bg-[#10B981] hover:!bg-[#059669] disabled:opacity-50 cursor-pointer">
              Valider le survol ({{ draftPoints().length }} pts)
            </button>
            <button type="button" 
                    (click)="cancelDrawing()" 
                    class="btn-ghost cursor-pointer">
              Annuler
            </button>
          }

          @if (selectedDrone().assignedPerimeter) {
            <button type="button" 
                    (click)="clearPerimeter()" 
                    class="btn-ghost hover:!text-[#F87171] hover:!border-[#EF4444]/40 cursor-pointer"
                    title="Libérer le périmètre et rétablir le vol standard">
              <app-icon name="x" [size]="11" /> Vol Libre
            </button>
          }
        </div>
      </div>

      <div [class]="'relative w-full overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#0A192F] ' + (height() ? '' : 'h-[280px] sm:h-[380px] md:h-[460px] lg:h-[520px]')" [style.height.px]="height() || null">
        <div #mapEl class="absolute inset-0" [class.cursor-crosshair]="drawingPerimeter()"></div>

        <!-- Alerte visuelle : mode tracé de périmètre actif -->
        @if (drawingPerimeter()) {
          <div class="pointer-events-none absolute top-3 left-3 z-[600] rounded-xl border border-[#38BDF8] bg-[#0A192F]/95 px-3 py-2 text-xs font-medium text-[#F8FAFC] shadow-2xl backdrop-blur-xs flex items-center gap-2">
            <span class="flex size-2 rounded-full bg-[#38BDF8] animate-ping"></span>
            <span>Cliquez sur la carte pour délimiter l'espace de survol (<b>{{ draftPoints().length }}</b> points posés · min. 3).</span>
          </div>
        }

        <!-- Badge flottant : périmètre de survol actuellement assigné au drone -->
        @if (!drawingPerimeter() && selectedDrone().assignedPerimeter; as perim) {
          <div class="pointer-events-none absolute top-3 left-3 z-[550] rounded-xl border border-[#10B981]/50 bg-[#0A192F]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-xs">
            <div class="flex items-center gap-2">
              <span class="flex size-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span class="font-bold text-[#F8FAFC]">Survol temps réel : <span class="text-[#34D399]">{{ selectedDrone().assignedZoneName }}</span></span>
            </div>
            <div class="text-[10px] text-[#94A3B8] mt-0.5">
              Le drone {{ selectedDrone().name }} patrouille activement à l'intérieur de cet espace.
            </div>
          </div>
        }

        <!-- Légende des drones en vol -->
        <ul class="absolute top-2 right-2 z-[500] max-w-[140px] sm:max-w-none space-y-1 rounded-xl border border-[#1E3A5F] bg-[#0A192F]/95 p-2 text-[9px] sm:text-[10px] shadow-xl backdrop-blur">
          @for (d of drones.drones(); track d.id; let i = $index) {
            <li>
              <button type="button" class="flex items-center gap-1.5 text-[#F8FAFC] hover:text-[#38BDF8] font-medium truncate" (click)="drones.select(d.id)">
                <span class="size-2 rounded-full shrink-0" [style.background]="color(i)"></span><span class="truncate">{{ d.name }}</span>
                @if (d.status === 'in-flight') { <span class="hidden sm:inline text-[#94A3B8]">· {{ modeLabel(d) }}</span> }
              </button>
            </li>
          }
        </ul>

        @if (selectedDrone(); as s) {
          <div class="absolute bottom-2 left-2 z-[500] max-w-[calc(100%-1rem)] rounded-xl border border-[#1E3A5F] bg-[#0A192F]/95 px-3 py-2 text-[9px] sm:text-[10px] text-[#F8FAFC] shadow-xl backdrop-blur">
            <div class="font-bold truncate text-[#F8FAFC] flex items-center gap-1.5">
              <span>{{ s.name }}</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded border border-[#1E3A5F] bg-[#0C1E3D] text-[#94A3B8]">{{ s.code }}</span>
              @if (s.assignedZoneName) {
                <span class="text-[9px] px-1.5 py-0.2 rounded border border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]">Zone : {{ s.assignedZoneName }}</span>
              }
              @if (s.rthActive) {
                <span class="text-[9px] px-1.5 py-0.2 rounded border border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#FBBF24]">RTH {{ s.rthAltitude }}m (Slot #{{ s.rthSlot }})</span>
              }
            </div>
            <div class="text-[#94A3B8] tabular-nums mt-0.5">
              Vit: <b class="text-[#F8FAFC]">{{ s.speed.toFixed(1) }} m/s</b> · Dist: <b class="text-[#34D399]">{{ fmtDist(s.distanceKm) }}</b> · Cap: <b class="text-[#F8FAFC]">{{ Math.round(s.heading) }}°</b> · Batt: <b class="text-[#34D399]">{{ s.batteryLevel.toFixed(0) }}%</b>
            </div>
            <button type="button" class="mt-1 font-semibold text-[#38BDF8] hover:underline" (click)="details.drone(s)">Fiche détaillée du drone</button>
          </div>
        }
      </div>
      <p class="mt-1.5 text-[9px] text-[#94A3B8]">Sélectionnez ou tracez un périmètre : le drone navigue et patrouille en continu dans cet espace en temps réel.</p>
    </section>
  `,
})
export class DroneMapComponent {
  protected readonly Math = Math;
  protected readonly fmtDist = fmtDistance;
  protected readonly drones = inject(DroneService);
  private readonly flights = inject(FlightService);
  private readonly control = inject(FlightControlService);
  protected readonly details = inject(DetailService);
  readonly height = input<number | null>(null);
  readonly controls = input(false);

  private readonly zoneService = inject(ZoneService);
  protected readonly zones = this.zoneService.zones;
  protected readonly selectedDrone = computed(() => this.drones.selected());
  protected readonly drawingPerimeter = signal<boolean>(false);
  protected readonly draftPoints = signal<LatLng[]>([]);

  private readonly mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private map?: L.Map;
  private resizeObserver?: ResizeObserver;
  private markers = new Map<string, L.Marker>();
  private trails = new Map<string, L.Polyline>();
  private trailHistory = new Map<string, LatLng[]>();
  private rthLines = new Map<string, L.Polyline>();
  private perimeterLayers = new Map<string, L.Polygon[]>();
  private zonePolygons = new Map<string, L.Polygon>();
  private activePerimeterLayer?: L.Polygon;
  private activeGuidelineLayer?: L.Polyline;
  private draftLine?: L.Polyline;
  private draftMarkers: L.CircleMarker[] = [];

  protected readonly follow = signal(true);
  protected readonly updated = signal('00:00:00');
  protected readonly meta = DRONE_STATUS;

  constructor() {
    afterNextRender(() => {
      this.init();
      this.renderAll();
    });

    effect(() => {
      const list = this.drones.drones();
      const sel = this.drones.selectedId();
      this.flights.schedule();
      if (!this.map) return;
      this.updateMarkers(list, sel);
      this.updated.set(new Date().toTimeString().slice(0, 8));
    });

    effect(() => {
      this.zones();
      if (!this.map) return;
      this.drawZones();
    });

    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.map?.remove();
      this.map = undefined;
    });
  }

  protected color(i: number): string {
    return DRONE_COLORS[i % DRONE_COLORS.length];
  }

  protected modeLabel(d: Drone): string {
    return FLIGHT_MODE[d.flightMode]?.label ?? d.flightMode;
  }

  protected fitFleet(): void {
    if (!this.map) return;
    const pts = this.drones.drones().map((d) => [d.latitude, d.longitude] as L.LatLngTuple);
    if (pts.length) {
      this.map.fitBounds(L.latLngBounds(pts).pad(0.35));
    }
  }

  protected planSafeRTH(): void {
    this.control.planSafeFleetRTH();
  }

  /** Assigner une zone prédéfinie au drone sélectionné */
  protected selectZone(z: SurveillanceZone): void {
    const sel = this.selectedDrone();
    if (!sel) return;
    this.drones.assignPerimeter(sel.id, z.polygon as LatLng[], z.name);
  }

  /** Libérer le périmètre et revenir en vol libre standard */
  protected clearPerimeter(): void {
    const sel = this.selectedDrone();
    if (!sel) return;
    this.drones.assignPerimeter(sel.id, undefined);
  }

  /** Démarrer le tracé d'un périmètre sur la carte */
  protected startDrawing(): void {
    this.drawingPerimeter.set(true);
    this.draftPoints.set([]);
  }

  /** Valider et appliquer le périmètre tracé pour le survol */
  protected finishDrawing(): void {
    const pts = this.draftPoints();
    if (pts.length < 3) return;
    const sel = this.selectedDrone();
    if (!sel) return;

    this.drones.assignPerimeter(sel.id, pts, 'Périmètre Sur Mesure');
    this.cancelDrawing();
  }

  /** Annuler le tracé */
  protected cancelDrawing(): void {
    this.drawingPerimeter.set(false);
    this.draftPoints.set([]);
    if (this.draftLine) {
      this.draftLine.remove();
      this.draftLine = undefined;
    }
    this.draftMarkers.forEach((m) => m.remove());
    this.draftMarkers = [];
  }

  private init(): void {
    const el = this.mapEl().nativeElement;
    this.map = L.map(el, { zoomControl: false }).setView([APP_SETTINGS.baseLat, APP_SETTINGS.baseLng], 16);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri',
    }).addTo(this.map);

    // Écouteur de clic pour le tracé interactif de périmètre
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.drawingPerimeter()) return;
      const pt: LatLng = [e.latlng.lat, e.latlng.lng];
      this.draftPoints.update((pts) => [...pts, pt]);
      this.updateDraftDrawing();
    });

    // Repère officiel Héliport Base FabLab UVCI
    const baseIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center size-8 rounded-full border-2 border-[#38BDF8] bg-[#0A192F] shadow-xl">
          <span class="text-xs font-black text-[#38BDF8]">H</span>
          <div class="absolute -inset-1 rounded-full border border-[#38BDF8]/40 animate-pulse"></div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([APP_SETTINGS.baseLat, APP_SETTINGS.baseLng], { icon: baseIcon, zIndexOffset: 50 })
      .bindTooltip('<b>Station Sol FabLab UVCI</b><br>Héliport & Base RTH Anti-Collision', { direction: 'top' })
      .addTo(this.map);

    this.drawZones();

    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(el);
  }

  private updateDraftDrawing(): void {
    if (!this.map) return;
    const pts = this.draftPoints();
    const latLngs = pts.map((p) => [p[0], p[1]] as L.LatLngTuple);

    if (this.draftLine) {
      this.draftLine.remove();
      this.draftLine = undefined;
    }
    this.draftMarkers.forEach((m) => m.remove());
    this.draftMarkers = [];

    latLngs.forEach((coord) => {
      const marker = L.circleMarker(coord, {
        radius: 5,
        color: '#38BDF8',
        fillColor: '#F8FAFC',
        fillOpacity: 1,
        weight: 2,
      }).addTo(this.map!);
      this.draftMarkers.push(marker);
    });

    if (latLngs.length >= 2) {
      this.draftLine = L.polyline(latLngs, {
        color: '#38BDF8',
        dashArray: '5 4',
        weight: 2,
      }).addTo(this.map);
    }
  }

  private drawZones(): void {
    if (!this.map) return;
    for (const poly of this.zonePolygons.values()) {
      poly.remove();
    }
    this.zonePolygons.clear();

    for (const z of this.zones()) {
      const poly = L.polygon(z.polygon, {
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4 4',
      })
        .bindTooltip(`<b>${z.name}</b><br>Cliquer pour assigner le survol`, { sticky: true })
        .addTo(this.map);

      poly.on('click', () => this.selectZone(z));
      this.zonePolygons.set(z.id, poly);
    }
  }

  private renderAll(): void {
    const list = this.drones.drones();
    const sel = this.drones.selectedId();
    this.updateMarkers(list, sel);
  }

  private updateMarkers(list: Drone[], selId: string): void {
    const map = this.map;
    if (!map) return;
    const currentIds = new Set(list.map((d) => d.id));

    for (const [id, m] of this.markers) {
      if (!currentIds.has(id)) {
        m.remove();
        this.markers.delete(id);
        this.trails.get(id)?.remove();
        this.trails.delete(id);
        this.trailHistory.delete(id);
        this.rthLines.get(id)?.remove();
        this.rthLines.delete(id);
      }
    }

    list.forEach((d, idx) => {
      const pos: L.LatLngTuple = [d.latitude, d.longitude];
      const isSelected = d.id === selId;
      const isFlying = d.status === 'in-flight';
      const c = this.color(idx);

      let hist = this.trailHistory.get(d.id);
      if (!hist) { hist = []; this.trailHistory.set(d.id, hist); }
      if (isFlying) {
        hist.push(pos as LatLng);
        if (hist.length > MAX_TRAIL) hist.shift();
      }

      let trail = this.trails.get(d.id);
      if (!trail) {
        trail = L.polyline(hist, { color: c, weight: 2, opacity: 0.7, dashArray: '3 4' }).addTo(map);
        this.trails.set(d.id, trail);
      } else {
        trail.setLatLngs(hist);
      }

      // Couloir de retour à la base déconflicté anti-collision
      let rthLine = this.rthLines.get(d.id);
      if (d.rthActive && isFlying) {
        const rthPts: L.LatLngTuple[] = [pos, [APP_SETTINGS.baseLat, APP_SETTINGS.baseLng]];
        if (!rthLine) {
          rthLine = L.polyline(rthPts, { color: '#F59E0B', weight: 2.5, dashArray: '6 4', opacity: 0.9 })
            .bindTooltip(`Couloir RTH Anti-Collision : Palier ${d.rthAltitude}m · Créneau #${d.rthSlot}`, { sticky: true })
            .addTo(map);
          this.rthLines.set(d.id, rthLine);
        } else {
          rthLine.setLatLngs(rthPts);
        }
      } else if (rthLine) {
        rthLine.remove();
        this.rthLines.delete(d.id);
      }

      // Icône drone dynamique orientée selon le cap en temps réel
      const icon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center size-10" style="transform: rotate(${Math.round(d.heading)}deg); transition: transform 0.3s linear;">
            ${isFlying ? `<div class="absolute inset-0 rounded-full animate-ping opacity-25" style="background:${c}"></div>` : ''}
            <svg viewBox="0 0 40 40" class="size-9 drop-shadow-lg">
              <line x1="8" y1="8" x2="32" y2="32" stroke="#1E3A5F" stroke-width="4" stroke-linecap="round"/>
              <line x1="32" y1="8" x2="8" y2="32" stroke="#1E3A5F" stroke-width="4" stroke-linecap="round"/>
              <circle cx="8" cy="8" r="4.5" fill="${c}" stroke="#0A192F" stroke-width="1.5" />
              <circle cx="32" cy="8" r="4.5" fill="${c}" stroke="#0A192F" stroke-width="1.5" />
              <circle cx="32" cy="32" r="4.5" fill="${c}" stroke="#0A192F" stroke-width="1.5" />
              <circle cx="8" cy="32" r="4.5" fill="${c}" stroke="#0A192F" stroke-width="1.5" />
              <rect x="13" y="13" width="14" height="14" rx="4" fill="#0C1E3D" stroke="${isSelected ? '#38BDF8' : '#1E3A5F'}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
              <polygon points="20,9 24,14 16,14" fill="#38BDF8"/>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      let marker = this.markers.get(d.id);
      if (!marker) {
        marker = L.marker(pos, { icon, zIndexOffset: isSelected ? 1000 : 100 }).addTo(map);
        marker.on('click', () => this.drones.select(d.id));
        this.markers.set(d.id, marker);
      } else {
        marker.setLatLng(pos);
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 1000 : 100);
      }

      const distStr = d.distanceKm >= 1 ? `${d.distanceKm.toFixed(2)} km` : `${Math.round(d.distanceKm * 1000)} m`;
      marker.bindTooltip(
        `<b>${d.name}</b> (${d.code})<br>` +
        `Vit: <b>${d.speed.toFixed(1)} m/s</b> (${(d.speed * 3.6).toFixed(0)} km/h)<br>` +
        `Dist: <b style="color:#34D399;">${distStr}</b> (+${Math.round(d.speed)} m/s)<br>` +
        `Alt: <b>${d.altitude.toFixed(0)} m</b> · Cap: <b>${Math.round(d.heading)}°</b><br>` +
        (d.assignedZoneName ? `<span style="color:#34D399;font-weight:bold;">📍 Zone de survol : ${d.assignedZoneName}</span><br>` : '') +
        (d.rthActive ? `<span style="color:#F59E0B;font-weight:bold;">⚡ RTH Sécurisé : Palier ${d.rthAltitude}m (Slot #${d.rthSlot})</span>` : `Batt: ${d.batteryLevel.toFixed(0)}%`),
        { direction: 'top' },
      );

      if (isSelected && this.follow() && isFlying) {
        map.panTo(pos, { animate: true, duration: 0.5 });
      }
    });

    // Dessiner le périmètre actif assigné au drone sélectionné
    const sel = list.find((d) => d.id === selId);
    if (this.activePerimeterLayer) {
      this.activePerimeterLayer.remove();
      this.activePerimeterLayer = undefined;
    }
    if (this.activeGuidelineLayer) {
      this.activeGuidelineLayer.remove();
      this.activeGuidelineLayer = undefined;
    }

    if (sel?.assignedPerimeter && sel.assignedPerimeter.length >= 3) {
      const poly = sel.assignedPerimeter.map((p) => [p[0], p[1]] as L.LatLngTuple);
      this.activePerimeterLayer = L.polygon(poly, {
        color: '#34D399',
        fillColor: '#34D399',
        fillOpacity: 0.22,
        weight: 3,
        dashArray: '6 4',
      })
        .bindTooltip(`<b>🎯 Périmètre actif : ${sel.assignedZoneName ?? 'Zone assignée'}</b><br>Survol en temps réel par ${sel.name}`, { sticky: true })
        .addTo(map);

      // Ligne de guidage reliant le drone au centre de sa zone de survol
      if (sel.status === 'in-flight') {
        const cLat = sel.assignedPerimeter.reduce((s, p) => s + p[0], 0) / sel.assignedPerimeter.length;
        const cLng = sel.assignedPerimeter.reduce((s, p) => s + p[1], 0) / sel.assignedPerimeter.length;
        this.activeGuidelineLayer = L.polyline([[sel.latitude, sel.longitude], [cLat, cLng]], {
          color: '#34D399',
          dashArray: '3 3',
          weight: 1.5,
          opacity: 0.8,
        }).addTo(map);
      }
    }

    this.drawScheduledPerimeters();
  }

  private drawScheduledPerimeters(): void {
    const map = this.map;
    if (!map) return;

    for (const arr of this.perimeterLayers.values()) arr.forEach((p) => p.remove());
    this.perimeterLayers.clear();

    for (const flight of this.flights.schedule()) {
      if (flight.status !== 'planned' && flight.status !== 'running') continue;
      const polys = flight.perimeters.map((poly: LatLng[], i: number) =>
        L.polygon(poly, {
          color: '#38BDF8',
          weight: 1.5,
          fillOpacity: 0.12,
          dashArray: '5 3',
        }).bindTooltip(`Zone planifiée #${i + 1} (${flight.status})`, { sticky: true }).addTo(map),
      );
      this.perimeterLayers.set(flight.id, polys);
    }
  }
}
