<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DroneController extends Controller
{
    /**
     * Liste tous les drones enregistrés avec leurs relations.
     */
    public function index(): JsonResponse
    {
        $drones = Drone::with(['cameras', 'capteurs', 'missions'])->latest()->get();
        return response()->json($drones);
    }

    /**
     * Enregistre un nouveau drone avec validation stricte.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'code_drone' => 'nullable|string|max:50|unique:drones,code_drone',
            'modele' => 'nullable|string|max:100',
            'numero_serie' => 'nullable|string|max:100|unique:drones,numero_serie',
            'statut' => 'nullable|string|in:disponible,en_vol,en_mission,en_retour_base,en_charge,en_maintenance,hors_ligne',
            'niveau_batterie' => 'required|numeric|min:0|max:100',
            'portee_max_km' => 'nullable|numeric|min:0',
            'latitude_actuelle' => 'nullable|numeric',
            'longitude_actuelle' => 'nullable|numeric',
            'altitude_actuelle' => 'nullable|numeric|min:0',
            'vitesse_actuelle' => 'nullable|numeric|min:0',
            'date_mise_en_service' => 'nullable|date',
        ], [
            'nom.required' => 'Le nom du drone est obligatoire.',
            'code_drone.unique' => 'Ce code drone est déjà attribué.',
            'niveau_batterie.required' => 'Le niveau de batterie est obligatoire.',
            'niveau_batterie.numeric' => 'La batterie doit être une valeur numérique.',
            'niveau_batterie.min' => 'Le niveau de batterie ne peut pas être inférieur à 0%.',
            'niveau_batterie.max' => 'Le niveau de batterie ne peut pas dépasser 100%.',
            'statut.in' => 'Le statut fourni est invalide.',
        ]);

        // Génération automatique si non fourni
        if (empty($validated['code_drone'])) {
            $validated['code_drone'] = 'DRN-' . strtoupper(Str::random(5));
        }
        if (empty($validated['modele'])) {
            $validated['modele'] = 'Hexacopter Agro-Surveillance V2';
        }
        if (empty($validated['numero_serie'])) {
            $validated['numero_serie'] = 'SN-' . strtoupper(Str::slug($validated['code_drone'])) . '-' . rand(1000, 9999);
        }
        if (empty($validated['statut'])) {
            $validated['statut'] = 'disponible';
        }
        if (empty($validated['portee_max_km'])) {
            $validated['portee_max_km'] = 15.00;
        }

        $drone = Drone::create($validated);

        return response()->json([
            'message' => 'Drone créé avec succès',
            'drone' => $drone->load(['cameras', 'capteurs', 'missions']),
        ], 201);
    }

    /**
     * Affiche les détails d'un drone.
     */
    public function show(string $id): JsonResponse
    {
        $drone = Drone::with(['cameras', 'capteurs', 'missions', 'inspections', 'incidents', 'detections'])->findOrFail($id);
        return response()->json($drone);
    }

    /**
     * Met à jour un drone existant.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $drone = Drone::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'code_drone' => 'sometimes|nullable|string|max:50|unique:drones,code_drone,' . $drone->id,
            'modele' => 'sometimes|nullable|string|max:100',
            'numero_serie' => 'sometimes|nullable|string|max:100|unique:drones,numero_serie,' . $drone->id,
            'statut' => 'sometimes|nullable|string|in:disponible,en_vol,en_mission,en_retour_base,en_charge,en_maintenance,hors_ligne',
            'niveau_batterie' => 'sometimes|required|numeric|min:0|max:100',
            'portee_max_km' => 'sometimes|nullable|numeric|min:0',
            'latitude_actuelle' => 'sometimes|nullable|numeric',
            'longitude_actuelle' => 'sometimes|nullable|numeric',
            'altitude_actuelle' => 'sometimes|nullable|numeric|min:0',
            'vitesse_actuelle' => 'sometimes|nullable|numeric|min:0',
            'date_mise_en_service' => 'sometimes|nullable|date',
            'derniere_communication_at' => 'sometimes|nullable|date',
        ], [
            'nom.required' => 'Le nom du drone est obligatoire.',
            'code_drone.unique' => 'Ce code drone est déjà attribué.',
            'niveau_batterie.numeric' => 'La batterie doit être une valeur numérique.',
            'niveau_batterie.min' => 'Le niveau de batterie ne peut pas être inférieur à 0%.',
            'niveau_batterie.max' => 'Le niveau de batterie ne peut pas dépasser 100%.',
            'statut.in' => 'Le statut fourni est invalide.',
        ]);

        $drone->update($validated);

        return response()->json([
            'message' => 'Drone mis à jour avec succès',
            'drone' => $drone->fresh(['cameras', 'capteurs', 'missions']),
        ]);
    }

    /**
     * Supprime définitivement un drone de la base de données.
     */
    public function destroy(string $id): JsonResponse
    {
        $drone = Drone::findOrFail($id);
        $code = $drone->code_drone;
        $nom = $drone->nom;

        // Force delete pour garantir que la ligne est complètement retirée de phpMyAdmin
        $drone->forceDelete();

        return response()->json([
            'message' => "Le drone « {$nom} » ({$code}) a été supprimé de la base de données avec succès.",
        ]);
    }
}
