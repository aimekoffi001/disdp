<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanificationVol;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanificationVolController extends Controller
{
    public function index(): JsonResponse
    {
        $vols = PlanificationVol::with(['drone', 'mission'])->latest('date_heure_depart_prevue')->get();
        return response()->json($vols);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mission_id' => 'required|exists:missions,id',
            'drone_id' => 'nullable|exists:drones,id',
            'numero_ordre' => 'nullable|integer',
            'point_depart' => 'nullable|string|max:100',
            'point_arrivee' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'altitude_m' => 'nullable|numeric|min:0',
            'vitesse_prevue_ms' => 'nullable|numeric|min:0',
            'date_heure_depart_prevue' => 'nullable|date',
            'date_heure_arrivee_prevue' => 'nullable|date',
            'statut' => 'nullable|string|in:en_attente,en_cours,termine,annule',
        ], [
            'mission_id.required' => 'La mission associée est obligatoire.',
            'mission_id.exists' => "La mission sélectionnée n'existe pas.",
        ]);

        if (empty($validated['numero_ordre'])) {
            $validated['numero_ordre'] = 1;
        }
        if (empty($validated['statut'])) {
            $validated['statut'] = 'en_attente';
        }
        if (empty($validated['date_heure_depart_prevue'])) {
            $validated['date_heure_depart_prevue'] = now()->addHour();
        }

        $vol = PlanificationVol::create($validated);

        return response()->json([
            'message' => 'Planification de vol enregistrée avec succès',
            'planification' => $vol->load(['drone', 'mission']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $vol = PlanificationVol::with(['drone', 'mission'])->findOrFail($id);
        return response()->json($vol);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $vol = PlanificationVol::findOrFail($id);

        $validated = $request->validate([
            'mission_id' => 'sometimes|required|exists:missions,id',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'numero_ordre' => 'sometimes|nullable|integer',
            'point_depart' => 'sometimes|nullable|string|max:100',
            'point_arrivee' => 'sometimes|nullable|string|max:100',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            'altitude_m' => 'sometimes|nullable|numeric|min:0',
            'vitesse_prevue_ms' => 'sometimes|nullable|numeric|min:0',
            'date_heure_depart_prevue' => 'sometimes|nullable|date',
            'date_heure_arrivee_prevue' => 'sometimes|nullable|date',
            'statut' => 'sometimes|nullable|string|in:en_attente,en_cours,termine,annule',
        ]);

        $vol->update($validated);

        return response()->json([
            'message' => 'Planification de vol mise à jour avec succès',
            'planification' => $vol->fresh(['drone', 'mission']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $vol = PlanificationVol::findOrFail($id);
        $vol->delete();

        return response()->json([
            'message' => 'Planification de vol supprimée de la base de données avec succès',
        ]);
    }
}
