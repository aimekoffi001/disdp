<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Api\DroneController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\DetectionController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\InspectionController;
use App\Http\Controllers\Api\CapteurController;
use App\Http\Controllers\Api\PlanificationVolController;
use App\Http\Controllers\Api\HistoriqueController;
use App\Http\Controllers\Api\ZoneStatiqueController;
use App\Http\Controllers\Api\CameraController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\SonController;

/*
|--------------------------------------------------------------------------
| API Routes - DISDP Platform REST API
|--------------------------------------------------------------------------
| Toutes les entités sont connectées à 100% à la base de données MySQL.
| Opérations CRUD complètes : index, store, show, update, destroy.
*/

// Vue globale & KPI du tableau de bord
Route::get('/dashboard', [DashboardController::class, 'index']);

// 1. Drones
Route::apiResource('drones', DroneController::class);

// 2. Missions
Route::apiResource('missions', MissionController::class);

// 3. Utilisateurs
Route::apiResource('utilisateurs', UtilisateurController::class);

// 4. Détections
Route::apiResource('detections', DetectionController::class);

// 5. Incidents & Alertes
Route::apiResource('incidents', IncidentController::class);

// 6. Inspections
Route::apiResource('inspections', InspectionController::class);

// 7. Capteurs
Route::apiResource('capteurs', CapteurController::class);

// 8. Planifications de Vol
Route::apiResource('planifications-vol', PlanificationVolController::class);
Route::apiResource('planifications_vol', PlanificationVolController::class);

// 9. Historiques & Traçabilité
Route::apiResource('historiques', HistoriqueController::class);

// 10. Zones Statiques de Surveillance
Route::apiResource('zones-statiques', ZoneStatiqueController::class);
Route::apiResource('zones_statiques', ZoneStatiqueController::class);

// 11. Caméras
Route::apiResource('cameras', CameraController::class);

// 12. Vidéos
Route::apiResource('videos', VideoController::class);

// 13. Sons & Émissions Sonores
Route::apiResource('sons', SonController::class);
