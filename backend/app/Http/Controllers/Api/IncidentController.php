<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class IncidentController extends Controller
{
    public function index(): JsonResponse
    {
        $incidents = Incident::with(['drone', 'mission', 'detection'])->latest('date_incident')->get();
        return response()->json($incidents);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:150',
            'code_incident' => 'nullable|string|max:50|unique:incidents,code_incident',
            'mission_id' => 'nullable|exists:missions,id',
            'detection_id' => 'nullable|exists:detections,id',
            'drone_id' => 'nullable|exists:drones,id',
            'type_incident' => 'required|string|max:50',
            'gravite' => 'required|string|in:faible,moyenne,haute,critique',
            'statut' => 'nullable|string|in:signale,en_cours,resolu,clos',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'date_incident' => 'nullable|date',
            'solution_apportee' => 'nullable|string',
        ], [
            'titre.required' => "Le titre de l'incident est obligatoire.",
            'type_incident.required' => "Le type d'incident est obligatoire.",
            'gravite.required' => 'Le niveau de gravité est obligatoire.',
            'gravite.in' => 'La gravité doit être faible, moyenne, haute ou critique.',
        ]);

        if (empty($validated['code_incident'])) {
            $validated['code_incident'] = 'INC-' . date('Y') . '-' . strtoupper(Str::random(4));
        }
        if (empty($validated['statut'])) {
            $validated['statut'] = 'signale';
        }
        if (empty($validated['date_incident'])) {
            $validated['date_incident'] = now();
        }

        $incident = Incident::create($validated);

        return response()->json([
            'message' => 'Incident enregistré avec succès',
            'incident' => $incident->load(['drone', 'mission', 'detection']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $incident = Incident::with(['drone', 'mission', 'detection'])->findOrFail($id);
        return response()->json($incident);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:150',
            'code_incident' => 'sometimes|nullable|string|max:50|unique:incidents,code_incident,' . $incident->id,
            'mission_id' => 'sometimes|nullable|exists:missions,id',
            'detection_id' => 'sometimes|nullable|exists:detections,id',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'type_incident' => 'sometimes|required|string|max:50',
            'gravite' => 'sometimes|required|string|in:faible,moyenne,haute,critique',
            'statut' => 'sometimes|nullable|string|in:signale,en_cours,resolu,clos',
            'description' => 'sometimes|nullable|string',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            'date_incident' => 'sometimes|nullable|date',
            'date_resolution' => 'sometimes|nullable|date',
            'solution_apportee' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['statut']) && in_array($validated['statut'], ['resolu', 'clos']) && empty($incident->date_resolution)) {
            $validated['date_resolution'] = now();
        }

        $incident->update($validated);

        return response()->json([
            'message' => 'Incident mis à jour avec succès',
            'incident' => $incident->fresh(['drone', 'mission', 'detection']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        $incident->delete();

        return response()->json([
            'message' => 'Incident supprimé de la base de données avec succès',
        ]);
    }
}
