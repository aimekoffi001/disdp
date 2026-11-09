<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Tableau de bord principal (avec support de recherche et filtrage par drone)
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// 1. Actionneurs & Répulsifs Acoustiques
Route::post('/emissions-sonores/declencher', [DashboardController::class, 'declencherSon'])->name('emissions.declencher');

// 2. Commandes Opérationnelles des Drones
Route::post('/drones', [DashboardController::class, 'creerDrone'])->name('drones.creer');
Route::post('/drones/ajouter', [DashboardController::class, 'creerDrone']);
Route::post('/drones/{id}/connecter-station', [DashboardController::class, 'connecterStation'])->name('drones.connecter-station');
Route::post('/drones/{id}/demarrer-vol', [DashboardController::class, 'demarrerVol'])->name('drones.demarrer-vol');
Route::post('/drones/{id}/atterrir', [DashboardController::class, 'atterrirDrone'])->name('drones.atterrir');
Route::post('/drones/{id}/statut', [DashboardController::class, 'changerStatutDrone'])->name('drones.statut');
Route::post('/drones/{id}/recharger', [DashboardController::class, 'rechargerBatterie'])->name('drones.recharger');
Route::post('/drones/{id}/simuler-telemetrie', [DashboardController::class, 'simulerTelemetrie'])->name('drones.simuler-telemetrie');
Route::post('/drones/{id}/simuler-detection', [DashboardController::class, 'simulerDetection'])->name('drones.simuler-detection');

// 3. Gestion & Planification des Missions
Route::post('/missions/creer', [DashboardController::class, 'creerMission'])->name('missions.creer');
Route::post('/missions/{id}/statut', [DashboardController::class, 'changerStatutMission'])->name('missions.statut');

// 4. Gestion des Alertes & Notifications
Route::post('/alertes/tout-acquitter', [DashboardController::class, 'acquitterToutesAlertes'])->name('alertes.tout-acquitter');
Route::post('/alertes/{id}/acquitter', [DashboardController::class, 'acquitterAlerte'])->name('alertes.acquitter');
Route::post('/alertes/{id}/resoudre', [DashboardController::class, 'resoudreAlerte'])->name('alertes.resoudre');
Route::post('/alertes/creer-test', [DashboardController::class, 'creerAlerteTest'])->name('alertes.creer-test');

// 5. API Télémétrie & Dashboard en temps réel (JSON)
Route::get('/api/dashboard', [DashboardController::class, 'index'])->name('api.dashboard');
Route::get('/api/drones/{id}/telemetrie', [DashboardController::class, 'apiDroneLive'])->name('api.drones.telemetrie');

// 6. Cockpit DISPD (Intégration du dossier disp / Angular)
Route::get('/cockpit', function () {
    return view('cockpit-angular');
})->name('cockpit');

// 7. Routes SPA Angular (gestion des rechargements directs d'URL dans le navigateur)
Route::get('/{any}', function () {
    return view('cockpit-angular');
})->where('any', 'dashboard|drones|missions|surveillance-zones|flight-planning|cameras|alerts|reports|settings|cockpit');

// Fallback global pour toute autre URL non-API (évite les pages blanches / 404 lors du routage client)
Route::fallback(function () {
    return view('cockpit-angular');
});
