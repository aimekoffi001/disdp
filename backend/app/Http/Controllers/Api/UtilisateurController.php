<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    public function index(): JsonResponse
    {
        $users = Utilisateur::latest()->get();
        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:utilisateurs,email',
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|in:admin,superviseur,pilote,analyste,technicien',
            'telephone' => 'nullable|string|max:20',
            'actif' => 'nullable|boolean',
        ], [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.required' => "L'adresse email est obligatoire.",
            'email.unique' => 'Cet email est déjà utilisé.',
        ]);

        $validated['password'] = Hash::make($validated['password'] ?? 'secret123');
        $validated['role'] = $validated['role'] ?? 'pilote';
        $validated['actif'] = $validated['actif'] ?? true;

        $user = Utilisateur::create($validated);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = Utilisateur::with(['missions', 'inspections', 'historiques'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = Utilisateur::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|max:150|unique:utilisateurs,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|nullable|string|in:admin,superviseur,pilote,analyste,technicien',
            'telephone' => 'sometimes|nullable|string|max:20',
            'actif' => 'sometimes|nullable|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = Utilisateur::findOrFail($id);
        $user->forceDelete();

        return response()->json([
            'message' => 'Utilisateur supprimé de la base de données avec succès',
        ]);
    }
}
