<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CameraController extends Controller
{
    public function index(): JsonResponse
    {
        $cameras = Camera::with('drone')->latest()->get();
        return response()->json($cameras);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drone_id' => 'required|exists:drones,id',
            'nom' => 'required|string|max:100',
            'modele' => 'nullable|string|max:100',
            'type_camera' => 'nullable|string|max:50',
            'resolution' => 'nullable|string|max:50',
            'angle_vision' => 'nullable|string|max:50',
            'zoom_optique' => 'nullable|string|max:50',
            'flux_rtsp_url' => 'nullable|string|max:255',
            'statut' => 'nullable|string|in:active,inactive,en_panne',
        ], [
            'drone_id.required' => 'Le drone associé est obligatoire.',
            'drone_id.exists' => "Le drone sélectionné n'existe pas.",
            'nom.required' => 'Le nom de la caméra est obligatoire.',
        ]);

        if (empty($validated['statut'])) {
            $validated['statut'] = 'active';
        }

        $camera = Camera::create($validated);

        return response()->json([
            'message' => 'Caméra ajoutée avec succès',
            'camera' => $camera->load('drone'),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $camera = Camera::with(['drone', 'videos'])->findOrFail($id);
        return response()->json($camera);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $camera = Camera::findOrFail($id);

        $validated = $request->validate([
            'drone_id' => 'sometimes|required|exists:drones,id',
            'nom' => 'sometimes|required|string|max:100',
            'modele' => 'sometimes|nullable|string|max:100',
            'type_camera' => 'sometimes|nullable|string|max:50',
            'resolution' => 'sometimes|nullable|string|max:50',
            'angle_vision' => 'sometimes|nullable|string|max:50',
            'zoom_optique' => 'sometimes|nullable|string|max:50',
            'flux_rtsp_url' => 'sometimes|nullable|string|max:255',
            'statut' => 'sometimes|nullable|string|in:active,inactive,en_panne',
        ]);

        $camera->update($validated);

        return response()->json([
            'message' => 'Caméra mise à jour avec succès',
            'camera' => $camera->fresh('drone'),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $camera = Camera::findOrFail($id);
        $camera->delete();

        return response()->json([
            'message' => 'Caméra supprimée de la base de données avec succès',
        ]);
    }
}

