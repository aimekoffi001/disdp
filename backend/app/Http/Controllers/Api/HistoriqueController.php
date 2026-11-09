<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoriqueController extends Controller
{
    public function index(): JsonResponse
    {
        $historiques = Historique::with(['drone', 'mission', 'utilisateur'])->latest('date_action')->get();
        return response()->json($historiques);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|max:100',
            'description' => 'nullable|string',
            'utilisateur_id' => 'nullable|exists:utilisateurs,id',
            'drone_id' => 'nullable|exists:drones,id',
            'mission_id' => 'nullable|exists:missions,id',
            'details_json' => 'nullable|array',
            'date_action' => 'nullable|date',
        ], [
            'action.required' => "L'action est obligatoire.",
        ]);

        if (empty($validated['date_action'])) {
            $validated['date_action'] = now();
        }
        $validated['ip_address'] = $request->ip();
        $validated['user_agent'] = $request->userAgent() ?? 'DISDP Web GCS';

        $historique = Historique::create($validated);

        return response()->json([
            'message' => 'Entrée historique enregistrée avec succès',
            'historique' => $historique->load(['drone', 'mission', 'utilisateur']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $historique = Historique::with(['drone', 'mission', 'utilisateur'])->findOrFail($id);
        return response()->json($historique);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $historique = Historique::findOrFail($id);

        $validated = $request->validate([
            'action' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|nullable|string',
            'utilisateur_id' => 'sometimes|nullable|exists:utilisateurs,id',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'mission_id' => 'sometimes|nullable|exists:missions,id',
            'details_json' => 'sometimes|nullable|array',
            'date_action' => 'sometimes|nullable|date',
        ]);

        $historique->update($validated);

        return response()->json([
            'message' => 'Historique mis à jour avec succès',
            'historique' => $historique->fresh(['drone', 'mission', 'utilisateur']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $historique = Historique::findOrFail($id);
        $historique->delete();

        return response()->json([
            'message' => 'Entrée historique supprimée de la base de données avec succès',
        ]);
    }
}

