<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\Capteur;
use App\Models\Detection;
use App\Models\Drone;
use App\Models\Historique;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\Mission;
use App\Models\PlanificationVol;
use App\Models\Son;
use App\Models\Utilisateur;
use App\Models\Video;
use App\Models\ZoneStatique;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Affiche le tableau de bord de supervision intelligente des drones DISDP.
     */
    public function index(Request $request)
    {
        // 1. Utilisateur principal connecté (Administrateur FabLab UVCI)
        $currentUser = Utilisateur::where('email', 'admin@fablab.ci')->first()
            ?? Utilisateur::first();

        // Si aucun utilisateur n'existe, on gère proprement la situation sans erreur 500
        if (!$currentUser) {
            if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Aucun utilisateur trouvé. Veuillez exécuter le seeder administrateur (php artisan db:seed --class=AdminSeeder).',
                ], 404);
            }

            if (\Illuminate\Support\Facades\Route::has('login')) {
                return redirect()->route('login')->with('warning', 'Aucun utilisateur trouvé. Veuillez vous connecter ou exécuter les seeders.');
            }

            return response(
                '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:550px;margin:80px auto;padding:30px;border-radius:12px;background:#0A192F;color:#F8FAFC;border:1px solid #1E3A5F;box-shadow:0 8px 24px rgba(0,0,0,0.3);text-align:center;">' .
                '<h2 style="color:#38BDF8;margin-bottom:12px;">Tableau de bord indisponible</h2>' .
                '<p style="color:#94A3B8;line-height:1.6;margin-bottom:20px;">Aucun utilisateur n\'a été trouvé dans la base de données (la table <code>utilisateurs</code> est vide).</p>' .
                '<div style="background:#112240;padding:15px;border-radius:8px;font-family:monospace;color:#34D399;margin-bottom:20px;text-align:left;overflow-x:auto;">' .
                'php artisan db:seed --class=AdminSeeder' .
                '</div>' .
                '<p style="color:#64748B;font-size:13px;">Exécutez cette commande pour créer le compte administrateur par défaut, puis actualisez cette page.</p>' .
                '</div>',
                200
            );
        }

        // 2. Recherche et filtrage
        $search = $request->query('search');

        // 3. Liste de tous les drones du parc avec caméras et capteurs
        $dronesQuery = Drone::with(['cameras', 'capteurs', 'missions'])
            ->orderBy('code_drone');

        if ($search) {
            $dronesQuery->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code_drone', 'like', "%{$search}%")
                  ->orWhere('modele', 'like', "%{$search}%");
            });
        }

        $drones = $dronesQuery->get();

        // 4. Drone actif sélectionné (par ?drone=id ou drone en vol par défaut)
        $selectedDroneId = $request->query('drone');
        if ($selectedDroneId) {
            $selectedDrone = Drone::with(['cameras', 'capteurs', 'missions'])->find((int) $selectedDroneId);
        } else {
            $selectedDrone = $drones->firstWhere('statut', 'en_vol') ?? $drones->first();
        }

        if (!$selectedDrone && $drones->isNotEmpty()) {
            $selectedDrone = $drones->first();
        }

        // 5. Mission active du drone sélectionné
        $currentMission = null;
        if ($selectedDrone) {
            $currentMission = $selectedDrone->missions()
                ->with(['zoneStatique', 'planificationsVol'])
                ->orderBy('date_debut_prevue', 'desc')
                ->first()
                ?? Mission::with(['zoneStatique', 'planificationsVol'])->orderBy('date_debut_prevue', 'desc')->first();
        }

        // 6. Caméra principale du drone sélectionné
        $primaryCamera = null;
        if ($selectedDrone) {
            $primaryCamera = Camera::where('drone_id', $selectedDrone->id)
                ->where('statut', 'active')
                ->first() ?? Camera::where('drone_id', $selectedDrone->id)->first();
        }

        // 7. Capteurs récents du drone sélectionné
        $capteursValues = [];
        if ($selectedDrone) {
            $capteurs = Capteur::where('drone_id', $selectedDrone->id)->get();
            foreach ($capteurs as $c) {
                $capteursValues[$c->type_capteur] = [
                    'nom' => $c->nom,
                    'valeur' => $c->derniere_valeur,
                    'unite' => $c->unite_mesure,
                    'statut' => $c->statut,
                ];
            }
        }

        // 8. Télémétrie en temps réel dérivée du drone
        $latestTelemetry = null;
        if ($selectedDrone) {
            $latestTelemetry = (object) [
                'id' => $selectedDrone->id,
                'drone_id' => $selectedDrone->id,
                'latitude' => (float) $selectedDrone->latitude_actuelle,
                'longitude' => (float) $selectedDrone->longitude_actuelle,
                'altitude' => (float) $selectedDrone->altitude_actuelle,
                'vitesse' => (float) $selectedDrone->vitesse_actuelle,
                'niveau_batterie' => (float) $selectedDrone->niveau_batterie,
                'tension_batterie_v' => 22.2,
                'temperature' => 31.5,
                'cap_de_vol' => 45,
                'nb_satellites' => 14,
                'force_signal_dbm' => -64,
                'date_mesure' => $selectedDrone->derniere_communication_at ?? now()->toIso8601String(),
            ];
        }

        // 9. KPI globaux du dashboard
        $kpi = [
            'batterie_moyenne' => round($drones->avg('niveau_batterie') ?? 0, 1),
            'distance_parcourue_km' => 6.7,
            'vitesse_moyenne_ms' => round($latestTelemetry?->vitesse ?? 8.4, 1),
            'portee_max_km' => $drones->max('portee_max_km') ?? 15.0,
            'drones_en_vol' => $drones->where('statut', 'en_vol')->count(),
            'drones_total' => $drones->count(),
            'alertes_non_resolues' => Incident::where('statut', '!=', 'resolu')->where('statut', '!=', 'clos')->count(),
        ];

        // 10. Missions récentes
        $missions = Mission::with(['drones', 'zoneStatique'])
            ->orderBy('date_debut_prevue', 'desc')
            ->take(6)
            ->get();

        // 11. Incidents & Détections (conformité 13 tables)
        $incidents = Incident::with(['drone', 'mission', 'detection'])
            ->orderBy('date_incident', 'desc')
            ->take(8)
            ->get();

        $detections = Detection::with(['drone', 'mission'])
            ->orderBy('date_detection', 'desc')
            ->take(6)
            ->get();

        $activeDetection = $detections->first();

        // 12. Zones statiques pour la cartographie
        $zones = ZoneStatique::all();

        // 13. Sons disponibles
        $sons = Son::where('actif', true)->get();

        // 14. Inspections & Historiques récents
        $inspections = Inspection::with(['drone', 'utilisateur'])
            ->orderBy('date_inspection', 'desc')
            ->take(6)
            ->get();

        $historiques = Historique::with(['utilisateur', 'drone'])
            ->orderBy('date_action', 'desc')
            ->take(8)
            ->get();

        // 15. Espèces / Cibles de détection simulées pour le laboratoire de tir
        $especes = [
            ['id' => 1, 'nom_commun' => 'Surchauffe Moteur 3 (Panne Matérielle)', 'nom_scientifique' => 'Fault: Rotor ESC 3', 'categorie' => 'panne'],
            ['id' => 2, 'nom_commun' => 'Calao à bec noir (Ravageur rizicole)', 'nom_scientifique' => 'Tockus nasutus', 'categorie' => 'oiseau'],
            ['id' => 3, 'nom_commun' => 'Aulacode / Grand Agouti (Rongeur)', 'nom_scientifique' => 'Thryonomys swinderianus', 'categorie' => 'rongeur'],
            ['id' => 4, 'nom_commun' => 'Câble électrique affaissé (Obstacle)', 'nom_scientifique' => 'Hazard: High Voltage Cable', 'categorie' => 'infrastructure'],
        ];

        // Format rétrocompatible pour l'UI React
        $alertes = $incidents->map(function ($inc) {
            return (object) [
                'id' => $inc->id,
                'drone_id' => $inc->drone_id,
                'mission_id' => $inc->mission_id,
                'type_alerte' => $inc->type_incident,
                'gravite' => $inc->gravite,
                'message' => $inc->titre . ' - ' . $inc->description,
                'statut' => $inc->statut,
                'created_at' => $inc->date_incident,
                'drone' => $inc->drone,
                'mission' => $inc->mission,
            ];
        });

        $emissionsRecentes = $historiques->where('action', 'declenchement_son')->values();

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'user' => $currentUser,
                'drones' => $drones,
                'selected_drone' => $selectedDrone,
                'latest_telemetry' => $latestTelemetry,
                'current_mission' => $currentMission,
                'primary_camera' => $primaryCamera,
                'capteurs_values' => $capteursValues,
                'kpi' => $kpi,
                'missions' => $missions,
                'alertes' => $alertes,
                'incidents' => $incidents,
                'detections' => $detections,
                'active_detection' => $activeDetection,
                'emissions_recentes' => $emissionsRecentes,
                'zones' => $zones,
                'sons' => $sons,
                'inspections' => $inspections,
                'historiques' => $historiques,
                'especes' => $especes,
                'search' => $search,
            ]);
        }

        return view('cockpit-angular', compact('currentUser', 'drones'));
    }

    /**
     * Action : Déclenchement d'une émission sonore depuis le dashboard.
     */
    public function declencherSon(Request $request)
    {
        $request->validate([
            'mission_id' => 'nullable|exists:missions,id',
            'drone_id' => 'nullable|exists:drones,id',
            'son_id' => 'required|exists:sons,id',
            'volume_pct' => 'nullable|integer|min:10|max:100',
        ]);

        $admin = Utilisateur::first();
        $son = Son::findOrFail($request->son_id);
        $drone = $request->drone_id ? Drone::find($request->drone_id) : Drone::first();

        // Enregistrer l'action dans les historiques
        $historique = Historique::create([
            'utilisateur_id' => $admin?->id,
            'drone_id' => $drone?->id,
            'mission_id' => $request->mission_id,
            'action' => 'declenchement_son',
            'description' => "Diffusion sonore '{$son->titre}' déclenchée depuis le cockpit sur {$drone?->nom}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'details_json' => [
                'son_id' => $son->id,
                'volume_pct' => $request->volume_pct ?? 90,
                'decibels' => $son->decibels,
            ],
            'date_action' => now(),
        ]);

        $msg = "Son '{$son->titre}' diffusé avec succès sur {$drone?->nom} !";

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'son' => $son,
                'historique' => $historique,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Action : Connecter un drone à la station de base pour autoriser les commandes et le démarrage.
     */
    public function connecterStation(Request $request, $id)
    {
        $drone = Drone::findOrFail($id);
        $drone->update([
            'derniere_communication_at' => now(),
        ]);

        Historique::create([
            'utilisateur_id' => Utilisateur::first()?->id,
            'drone_id' => $drone->id,
            'action' => 'connexion_station',
            'description' => "Drone {$drone->nom} ({$drone->code_drone}) connecté à la Station de Base FabLab UVCI.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'details_json' => ['frequence' => '868 MHz LoRa', 'statut' => 'connecte'],
            'date_action' => now(),
        ]);

        $msg = "Liaison radio établie : Drone {$drone->nom} ({$drone->code_drone}) connecté à la Station de Base (LoRa 868 MHz · MAVLink).";

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'drone' => $drone->fresh(),
                'station_base' => [
                    'nom' => 'Station Sol FabLab UVCI Alpha-1',
                    'protocole' => 'MAVLink 2.0 / LoRa 868 MHz',
                    'qualite_signal' => 100,
                    'signal_dbm' => -62,
                    'connecte' => true,
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Action majeure : Démarrer un drone et le faire décoller.
     */
    public function demarrerVol(Request $request, $id)
    {
        $drone = Drone::findOrFail($id);

        $mission = $drone->missions()
            ->whereIn('missions.statut', ['en_cours', 'planifiee'])
            ->latest('date_debut_prevue')
            ->first();

        if (!$mission) {
            $zone = ZoneStatique::first();
            $mission = Mission::create([
                'code_mission' => 'MSN-' . date('Y') . '-' . str_pad((string) (Mission::count() + 1), 3, '0', STR_PAD_LEFT),
                'nom' => "Mission Vol {$drone->code_drone}",
                'type_mission' => 'surveillance',
                'description' => "Vol de surveillance autonome lancé depuis la station de base.",
                'utilisateur_id' => Utilisateur::first()?->id ?? 1,
                'zone_statique_id' => $zone?->id,
                'date_debut_prevue' => now(),
                'date_debut_reelle' => now(),
                'altitude_vol_m' => 45.0,
                'vitesse_croisiere_ms' => 8.5,
                'statut' => 'en_cours',
            ]);

            $mission->drones()->syncWithoutDetaching([
                $drone->id => ['role_drone' => 'principal', 'statut' => 'en_vol'],
            ]);
        } else {
            $mission->update([
                'statut' => 'en_cours',
                'date_debut_reelle' => now(),
            ]);
            $mission->drones()->updateExistingPivot($drone->id, ['statut' => 'en_vol']);
        }

        $drone->update([
            'statut' => 'en_vol',
            'altitude_actuelle' => 45.00,
            'vitesse_actuelle' => 8.50,
            'derniere_communication_at' => now(),
        ]);

        Historique::create([
            'utilisateur_id' => Utilisateur::first()?->id,
            'drone_id' => $drone->id,
            'mission_id' => $mission->id,
            'action' => 'demarrage_vol',
            'description' => "Décollage VTOL réussi pour le drone {$drone->nom}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'date_action' => now(),
        ]);

        $msg = "Drone {$drone->nom} mis en marche avec succès ! Décollage VTOL validé, drone en vol à 45m.";

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'drone' => $drone->fresh(),
                'mission' => $mission->fresh(['zoneStatique']),
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Action : Atterrir le drone en vol et couper les moteurs.
     */
    public function atterrirDrone(Request $request, $id)
    {
        $drone = Drone::findOrFail($id);

        $mission = $drone->missions()
            ->where('missions.statut', 'en_cours')
            ->latest('date_debut_prevue')
            ->first();

        if ($mission) {
            $mission->update([
                'statut' => 'terminee',
                'date_fin_reelle' => now(),
            ]);
            $mission->drones()->updateExistingPivot($drone->id, ['statut' => 'termine']);
        }

        $drone->update([
            'statut' => 'disponible',
            'altitude_actuelle' => 0.00,
            'vitesse_actuelle' => 0.00,
            'derniere_communication_at' => now(),
        ]);

        Historique::create([
            'utilisateur_id' => Utilisateur::first()?->id,
            'drone_id' => $drone->id,
            'mission_id' => $mission?->id,
            'action' => 'atterrissage',
            'description' => "Atterrissage réussi pour le drone {$drone->nom}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'date_action' => now(),
        ]);

        $msg = "Drone {$drone->nom} a atterri avec succès ! Moteurs coupés, retour au statut disponible.";

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'drone' => $drone->fresh(),
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Action : Changer manuellement le statut d'un drone.
     */
    public function changerStatutDrone(Request $request, $id)
    {
        $request->validate([
            'statut' => 'required|string',
        ]);

        $drone = Drone::findOrFail($id);
        $drone->update([
            'statut' => $request->statut,
            'derniere_communication_at' => now(),
        ]);

        $msg = "Statut du drone {$drone->nom} mis à jour : {$request->statut} !";

        if ($request->wantsJson() || $request->ajax() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'drone' => $drone->fresh(),
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Action : Simuler une télémétrie en temps réel.
     */
    public function simulerTelemetrie(Request $request, $id)
    {
        $drone = Drone::findOrFail($id);

        if ($drone->statut === 'en_vol') {
            $newBattery = max(5.0, (float) $drone->niveau_batterie - 0.08);
            $drone->update([
                'niveau_batterie' => $newBattery,
                'derniere_communication_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'drone_id' => $drone->id,
            'statut' => $drone->statut,
            'batterie' => (float) $drone->niveau_batterie,
            'altitude' => (float) $drone->altitude_actuelle,
            'vitesse' => (float) $drone->vitesse_actuelle,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Action : Simuler une détection IA de panne ou d'anomalie.
     */
    public function simulerDetection(Request $request, $id)
    {
        $drone = Drone::findOrFail($id);
        $mission = $drone->missions()->latest()->first() ?? Mission::first();

        $cibles = [
            ['type' => 'panne_materielle', 'cible' => 'Surchauffe Contrôleur ESC Moteur 3', 'gravite' => 'critique'],
            ['type' => 'animal_ravageur', 'cible' => 'Calao à bec noir détecté sur parcelle', 'gravite' => 'eleve'],
            ['type' => 'obstacle', 'cible' => 'Câble haute tension affaissé', 'gravite' => 'eleve'],
            ['type' => 'panne_materielle', 'cible' => 'Vibration anormale roulement rotor 2', 'gravite' => 'moyen'],
        ];

        $choice = $cibles[array_rand($cibles)];

        $detection = Detection::create([
            'mission_id' => $mission?->id ?? 1,
            'drone_id' => $drone->id,
            'type_detection' => $choice['type'],
            'cible_detectee' => $choice['cible'],
            'confiance_pct' => rand(88, 98) + 0.5,
            'latitude' => $drone->latitude_actuelle ?? 5.3582,
            'longitude' => $drone->longitude_actuelle ?? -3.8914,
            'altitude_m' => $drone->altitude_actuelle ?? 45.0,
            'date_detection' => now(),
            'niveau_gravite' => $choice['gravite'],
            'details' => "Détection IA instantanée captée par caméra et télémètre du drone {$drone->code_drone}.",
            'statut' => 'a_traiter',
        ]);

        // Si critique, créer un incident
        if ($choice['gravite'] === 'critique' || $choice['gravite'] === 'eleve') {
            Incident::create([
                'code_incident' => 'INC-' . date('Y') . '-' . str_pad((string) (Incident::count() + 1), 3, '0', STR_PAD_LEFT),
                'mission_id' => $mission?->id,
                'detection_id' => $detection->id,
                'drone_id' => $drone->id,
                'titre' => $choice['cible'],
                'description' => "Incident généré automatiquement suite à la détection #{$detection->id}.",
                'type_incident' => $choice['type'] === 'panne_materielle' ? 'panne_moteur' : 'collision_evitee',
                'gravite' => $choice['gravite'],
                'statut' => 'ouvert',
                'latitude' => $detection->latitude,
                'longitude' => $detection->longitude,
                'date_incident' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'detection' => $detection,
            'message' => "Nouvelle détection enregistrée : {$choice['cible']} !",
        ]);
    }

    /**
     * Action : Créer une mission.
     */
    public function creerMission(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:150',
            'type_mission' => 'nullable|string',
            'drone_id' => 'nullable|exists:drones,id',
            'zone_statique_id' => 'nullable|exists:zones_statiques,id',
            'altitude_vol_m' => 'nullable|numeric',
            'vitesse_croisiere_ms' => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        $admin = Utilisateur::first();

        $mission = Mission::create([
            'code_mission' => 'MSN-' . date('Y') . '-' . str_pad((string) (Mission::count() + 1), 3, '0', STR_PAD_LEFT),
            'nom' => $request->nom,
            'type_mission' => $request->type_mission ?? 'surveillance',
            'statut' => 'planifiee',
            'utilisateur_id' => $admin?->id ?? 1,
            'zone_statique_id' => $request->zone_statique_id ?? ZoneStatique::first()?->id,
            'date_debut_prevue' => now()->addMinutes(30),
            'altitude_vol_m' => $request->altitude_vol_m ?? 45.0,
            'vitesse_croisiere_ms' => $request->vitesse_croisiere_ms ?? 8.0,
            'description' => $request->description,
        ]);

        if ($request->drone_id) {
            $mission->drones()->attach($request->drone_id, ['role_drone' => 'principal', 'statut' => 'assigne']);
        }

        return response()->json([
            'success' => true,
            'message' => "Mission {$mission->nom} créée avec succès !",
            'mission' => $mission->load(['drones', 'zoneStatique']),
        ]);
    }

    /**
     * Action : Changer le statut d'une mission.
     */
    public function changerStatutMission(Request $request, $id)
    {
        $request->validate(['statut' => 'required|string']);
        $mission = Mission::findOrFail($id);
        $mission->update(['statut' => $request->statut]);

        return response()->json([
            'success' => true,
            'message' => "Statut de la mission mis à jour : {$request->statut}",
            'mission' => $mission,
        ]);
    }

    /**
     * Action : Acquitter / Résoudre un incident.
     */
    public function acquitterAlerte(Request $request, $id)
    {
        $inc = Incident::find($id);
        if ($inc) {
            $inc->update(['statut' => 'en_analyse']);
        }
        return response()->json(['success' => true, 'message' => "Incident #{$id} acquitté."]);
    }

    public function resoudreAlerte(Request $request, $id)
    {
        $inc = Incident::find($id);
        if ($inc) {
            $inc->update([
                'statut' => 'resolu',
                'date_resolution' => now(),
                'solution_apportee' => 'Résolution validée par l\'administrateur.',
            ]);
        }
        return response()->json(['success' => true, 'message' => "Incident #{$id} résolu."]);
    }

    public function acquitterToutesAlertes(Request $request)
    {
        Incident::whereIn('statut', ['ouvert', 'en_analyse'])->update(['statut' => 'resolu', 'date_resolution' => now()]);
        return response()->json(['success' => true, 'message' => "Tous les incidents ont été résolus."]);
    }

    /**
     * Action : Créer une alerte / incident de test.
     */
    public function creerAlerteTest(Request $request)
    {
        $drone = $request->drone_id ? Drone::find($request->drone_id) : Drone::first();
        $inc = Incident::create([
            'code_incident' => 'INC-' . date('Y') . '-' . str_pad((string) (Incident::count() + 1), 3, '0', STR_PAD_LEFT),
            'drone_id' => $drone?->id,
            'titre' => 'Alerte test de supervision opérationnelle',
            'description' => 'Test de notification déclenché manuellement.',
            'type_incident' => $request->type_alerte ?? 'panne_moteur',
            'gravite' => $request->gravite ?? 'moyenne',
            'statut' => 'ouvert',
            'date_incident' => now(),
        ]);

        return response()->json(['success' => true, 'message' => "Incident test créé !", 'incident' => $inc]);
    }

    /**
     * Action : API Live Drone.
     */
    public function apiDroneLive($id)
    {
        $drone = Drone::with(['cameras', 'capteurs'])->findOrFail($id);
        return response()->json([
            'drone' => $drone,
            'latitude' => (float) $drone->latitude_actuelle,
            'longitude' => (float) $drone->longitude_actuelle,
            'altitude' => (float) $drone->altitude_actuelle,
            'vitesse' => (float) $drone->vitesse_actuelle,
            'batterie' => (float) $drone->niveau_batterie,
            'statut' => $drone->statut,
        ]);
    }

    /**
     * Action : Ajouter un nouveau drone.
     */
    public function creerDrone(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'code_drone' => 'required|string|max:50|unique:drones,code_drone',
            'modele' => 'required|string|max:100',
            'numero_serie' => 'required|string|max:100|unique:drones,numero_serie',
            'portee_max_km' => 'nullable|numeric',
            'latitude_actuelle' => 'nullable|numeric',
            'longitude_actuelle' => 'nullable|numeric',
        ]);

        $drone = Drone::create([
            'nom' => $request->nom,
            'code_drone' => $request->code_drone,
            'modele' => $request->modele,
            'numero_serie' => $request->numero_serie,
            'statut' => 'disponible',
            'niveau_batterie' => 100.0,
            'portee_max_km' => $request->portee_max_km ?? 15.0,
            'latitude_actuelle' => $request->latitude_actuelle ?? 5.3551,
            'longitude_actuelle' => $request->longitude_actuelle ?? -3.8942,
            'altitude_actuelle' => 0.0,
            'vitesse_actuelle' => 0.0,
            'date_mise_en_service' => now(),
            'derniere_communication_at' => now(),
        ]);

        // Ajouter une caméra par défaut
        Camera::create([
            'drone_id' => $drone->id,
            'nom' => 'Caméra Optique HD ' . $drone->code_drone,
            'modele' => 'Sony Ultra HD 4K',
            'type_camera' => 'optique',
            'resolution' => '3840x2160',
            'statut' => 'active',
        ]);

        Historique::create([
            'utilisateur_id' => Utilisateur::first()?->id,
            'drone_id' => $drone->id,
            'action' => 'creation_drone',
            'description' => "Nouveau drone {$drone->nom} ({$drone->code_drone}) ajouté à la flotte.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'date_action' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Drone {$drone->nom} ({$drone->code_drone}) ajouté avec succès !",
            'drone' => $drone->fresh(['cameras']),
        ]);
    }
}
