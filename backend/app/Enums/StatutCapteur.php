<?php

namespace App\Enums;

enum StatutCapteur: string
{
    case Actif = 'actif';
    case Defectueux = 'defectueux';
    case Desactive = 'desactive';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
