<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Utilisateur::updateOrCreate(
            ['email' => 'admin@fablab.ci'],
            [
                'nom' => 'Admin',
                'prenom' => 'FabLab',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'telephone' => '0700000000',
                'actif' => 1,
            ]
        );

        Utilisateur::updateOrCreate(
            ['email' => 'pilote.kone@fablab.ci'],
            [
                'nom' => 'Koné',
                'prenom' => 'Ibrahim',
                'password' => Hash::make('password123'),
                'role' => 'pilote',
                'telephone' => '+225 05 04 03 02 01',
                'actif' => 1,
            ]
        );
    }
}

