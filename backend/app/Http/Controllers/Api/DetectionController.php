<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Detection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DetectionController extends Controller
{
    public function index(): JsonResponse
    {
        $detections = Detection::with(['drone', 'mission'])->latest('date_detection')->get();
        return response()->json($detections);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drone_id' => 'nullable|exists:drones,id',
            'mission_id' => 'nullable|exists:missions,id',
            'type_detection' => 'required|string|max:50',
            'cible_detectee' => 'required|string|max:100',
            'confiance_pct' => 'required|numeric|min:0|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'altitude_m' => 'nullable|numeric',
            'date_detection' => 'nullable|date',
            'niveau_gravite' => 'nullable|string|in:faible,moyen,eleve,critique',
            'details' => 'nullable|string',
            'photo_snapshot_url' => 'nullable|string|max:255',
            'statut' => 'nullable|string|in:a_traiter,en_cours,traite,faux_positif',
        ], [
            'type_detection.required' => 'Le type de détection est obligatoire.',
            'cible_detectee.required' => 'La cible détectée est obligatoire.',
            'confiance_pct.required' => 'Le pourcentage de confiance est obligatoire.',
            'confiance_pct.numeric' => 'La confiance doit être une valeur numérique.',
        ]);

        if (empty($validated['date_detection'])) {
            $validated['date_detection'] = now();
        }
        if (empty($validated['statut'])) {
            $validated['statut'] = 'a_traiter';
        }
        if (empty($validated['mission_id'])) {
            $validated['mission_id'] = \App\Models\Mission::first()?->id ?? 1;
        }
        if (empty($validated['drone_id'])) {
            $validated['drone_id'] = \App\Models\Drone::first()?->id ?? 1;
        }
        if (empty($validated['latitude'])) {
            $validated['latitude'] = 5.3594;
        }
        if (empty($validated['longitude'])) {
            $validated['longitude'] = -4.0083;
        }

        $detection = Detection::create($validated);

        return response()->json([
            'message' => 'Détection enregistrée avec succès',
            'detection' => $detection->load(['drone', 'mission']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $detection = Detection::with(['drone', 'mission', 'incidents'])->findOrFail($id);
        return response()->json($detection);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $detection = Detection::findOrFail($id);

        $validated = $request->validate([
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'mission_id' => 'sometimes|nullable|exists:missions,id',
            'type_detection' => 'sometimes|required|string|max:50',
            'cible_detectee' => 'sometimes|required|string|max:100',
            'confiance_pct' => 'sometimes|required|numeric|min:0|max:100',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            'altitude_m' => 'sometimes|nullable|numeric',
            'date_detection' => 'sometimes|nullable|date',
            'niveau_gravite' => 'sometimes|nullable|string|in:faible,moyen,eleve,critique',
            'details' => 'sometimes|nullable|string',
            'photo_snapshot_url' => 'sometimes|nullable|string|max:255',
            'statut' => 'sometimes|nullable|string',
        ]);

        $detection->update($validated);

        return response()->json([
            'message' => 'Détection mise à jour avec succès',
            'detection' => $detection->fresh(['drone', 'mission']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $detection = Detection::findOrFail($id);
        $detection->delete();

        return response()->json([
            'message' => 'Détection supprimée de la base de données avec succès',
        ]);
    }
}

