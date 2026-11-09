/**
 * Configuration de l'application DISDP.
 * Connecté à 100% à la base de données MySQL via l'API Laravel.
 */
export const APP_SETTINGS = {
  /** Mode réel connecté (aucune donnée fictive ni démo) */
  demoMode: false,
  /** Intervalle de rafraîchissement télémétrie en direct (ms) : 1 Hz temps réel fluide */
  telemetryIntervalMs: 1000,
  /** Position de référence GPS */
  baseLat: 5.3321,
  baseLng: -4.0217,
  /** Portée maximale annoncée (km) */
  maxRangeKm: 16,
  /** Sources vidéo */
  demoVideoSources: [] as string[],
  storageTotalGb: 64,
  liveStreamUrl: '' as string,
  storagePrefix: 'dispd.v3.',
};
