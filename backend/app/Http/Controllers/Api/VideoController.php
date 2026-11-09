<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function index(): JsonResponse
    {
        $videos = Video::with(['drone', 'camera', 'mission'])->latest('date_enregistrement')->get();
        return response()->json($videos);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:150',
            'chemin_fichier' => 'required|string|max:255',
            'mission_id' => 'nullable|exists:missions,id',
            'drone_id' => 'nullable|exists:drones,id',
            'camera_id' => 'nullable|exists:cameras,id',
            'format' => 'nullable|string|max:10',
            'resolution' => 'nullable|string|max:50',
            'duree_secondes' => 'nullable|integer|min:0',
            'taille_octets' => 'nullable|integer|min:0',
            'date_enregistrement' => 'nullable|date',
        ], [
            'titre.required' => 'Le titre de la vidéo est obligatoire.',
            'chemin_fichier.required' => 'Le chemin du fichier est obligatoire.',
        ]);

        if (empty($validated['date_enregistrement'])) {
            $validated['date_enregistrement'] = now();
        }

        $video = Video::create($validated);

        return response()->json([
            'message' => 'Vidéo enregistrée avec succès',
            'video' => $video->load(['drone', 'camera', 'mission']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $video = Video::with(['drone', 'camera', 'mission'])->findOrFail($id);
        return response()->json($video);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $video = Video::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:150',
            'chemin_fichier' => 'sometimes|required|string|max:255',
            'mission_id' => 'sometimes|nullable|exists:missions,id',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'camera_id' => 'sometimes|nullable|exists:cameras,id',
            'format' => 'sometimes|nullable|string|max:10',
            'resolution' => 'sometimes|nullable|string|max:50',
            'duree_secondes' => 'sometimes|nullable|integer|min:0',
            'taille_octets' => 'sometimes|nullable|integer|min:0',
            'date_enregistrement' => 'sometimes|nullable|date',
        ]);

        $video->update($validated);

        return response()->json([
            'message' => 'Vidéo mise à jour avec succès',
            'video' => $video->fresh(['drone', 'camera', 'mission']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $video = Video::findOrFail($id);
        $video->delete();

        return response()->json([
            'message' => 'Vidéo supprimée de la base de données avec succès',
        ]);
    }
}
