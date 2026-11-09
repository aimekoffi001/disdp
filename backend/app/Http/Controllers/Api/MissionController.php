<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MissionController extends Controller
{
    /**
     * Liste toutes les missions avec leurs drones et zones associées.
     */
    public function index(): JsonResponse
    {
        $missions = Mission::with(['drones', 'zoneStatique', 'utilisateur'])->latest()->get();
        return response()->json($missions);
    }

    /**
     * Enregistre une nouvelle mission.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'code_mission' => 'nullable|string|max:50|unique:missions,code_mission',
            'type_mission' => 'nullable|string|max:50',
            'statut' => 'nullable|string|in:planifiee,en_cours,terminee,annulee,suspendue',
            'utilisateur_id' => 'nullable|exists:utilisateurs,id',
            'zone_statique_id' => 'nullable|exists:zones_statiques,id',
            'altitude_vol_m' => 'nullable|numeric|min:0',
            'vitesse_croisiere_ms' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'date_debut_prevue' => 'nullable|date',
            'date_fin_prevue' => 'nullable|date',
            'drone_id' => 'nullable|exists:drones,id',
        ], [
            'nom.required' => 'Le nom de la mission est obligatoire.',
            'code_mission.unique' => 'Ce code mission existe déjà.',
            'statut.in' => 'Le statut fourni est invalide.',
        ]);

        if (empty($validated['code_mission'])) {
            $validated['code_mission'] = 'MSN-' . date('Y') . '-' . strtoupper(Str::random(4));
        }
        if (empty($validated['type_mission'])) {
            $validated['type_mission'] = 'surveillance';
        }
        if (empty($validated['statut'])) {
            $validated['statut'] = 'planifiee';
        }

        $droneId = $validated['drone_id'] ?? null;
        unset($validated['drone_id']);

        $mission = Mission::create($validated);

        if ($droneId) {
            $mission->drones()->syncWithoutDetaching([
                $droneId => ['role_drone' => 'principal', 'statut' => 'assigne'],
            ]);
        }

        return response()->json([
            'message' => 'Mission créée avec succès',
            'mission' => $mission->load(['drones', 'zoneStatique', 'utilisateur']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $mission = Mission::with(['drones', 'zoneStatique', 'utilisateur', 'planificationsVol', 'detections', 'incidents'])->findOrFail($id);
        return response()->json($mission);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $mission = Mission::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'code_mission' => 'sometimes|nullable|string|max:50|unique:missions,code_mission,' . $mission->id,
            'type_mission' => 'sometimes|nullable|string|max:50',
            'statut' => 'sometimes|nullable|string|in:planifiee,en_cours,terminee,annulee,suspendue',
            'utilisateur_id' => 'sometimes|nullable|exists:utilisateurs,id',
            'zone_statique_id' => 'sometimes|nullable|exists:zones_statiques,id',
            'altitude_vol_m' => 'sometimes|nullable|numeric|min:0',
            'vitesse_croisiere_ms' => 'sometimes|nullable|numeric|min:0',
            'description' => 'sometimes|nullable|string|max:1000',
            'date_debut_prevue' => 'sometimes|nullable|date',
            'date_fin_prevue' => 'sometimes|nullable|date',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
        ]);

        $droneId = $validated['drone_id'] ?? null;
        unset($validated['drone_id']);

        $mission->update($validated);

        if ($droneId) {
            $mission->drones()->sync([
                $droneId => ['role_drone' => 'principal', 'statut' => 'assigne'],
            ]);
        }

        return response()->json([
            'message' => 'Mission mise à jour avec succès',
            'mission' => $mission->fresh(['drones', 'zoneStatique', 'utilisateur']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $mission = Mission::findOrFail($id);
        $mission->drones()->detach();
        $mission->forceDelete();

        return response()->json([
            'message' => "La mission a été supprimée de la base de données avec succès.",
        ]);
    }
}
