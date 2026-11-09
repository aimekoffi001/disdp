/**
 * Paramètres de l'application.
 * Pour brancher un backend / un flux réel, modifier ici (et implémenter les services correspondants).
 */
export const APP_SETTINGS = {
  /** Mode démonstration : télémétrie simulée, données locales. */
  demoMode: true,
  /** Intervalle de simulation (ms). */
  telemetryIntervalMs: 1000,
  /** Position de la base (fictive, Abidjan) autour de laquelle sont placés les drones. */
  baseLat: 5.3321,
  baseLng: -4.0217,
  /** Portée maximale annoncée (km) — donnée de configuration, non mesurée. */
  maxRangeKm: 16,
  /**
   * Sources vidéo de démonstration, essayées dans l'ordre.
   * 1) un fichier local à déposer dans public/media/ (ex. une vidéo libre de droits de drone agricole
   *    téléchargée sur Pexels ou Pixabay) ; 2) une vidéo libre distante (CC0, MDN).
   * Si aucune ne se charge, l'état « flux indisponible » est affiché.
   */
  demoVideoSources: [
    'media/demo-drone.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  ] as string[],
  /** URL d'un futur flux réel (HLS/WebRTC…). Laisser vide en démonstration. */
  /** Capacité de stockage embarqué simulée (Go). */
  storageTotalGb: 64,
  liveStreamUrl: '' as string,
  storagePrefix: 'dispd.v3.',
};
