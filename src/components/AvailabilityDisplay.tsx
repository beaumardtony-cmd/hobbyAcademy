import { Clock } from 'lucide-react';

interface AvailabilityDisplayProps {
  availability: string | object | null;
  className?: string;
  compact?: boolean;
}

export default function AvailabilityDisplay({ 
  availability, 
  className = '',
  compact = false 
}: AvailabilityDisplayProps) {
  if (!availability) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Disponibilités non renseignées
      </div>
    );
  }

  // Si c'est une chaîne simple (pas JSON), l'afficher directement
  if (typeof availability === 'string') {
    // Vérifier si c'est du JSON ou du texte simple
    try {
      const parsed = JSON.parse(availability);
      // Si le parsing réussit et que c'est un objet, continuer avec le format structuré
      if (typeof parsed === 'object' && parsed !== null) {
        // Le code de parsing structuré continue ci-dessous
      }
    } catch {
      // Ce n'est pas du JSON, c'est du texte simple - l'afficher tel quel
      return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
          <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span className="text-gray-700">{availability}</span>
        </div>
      );
    }
  }

  // Parser la disponibilité (format JSON structuré)
  let availabilityObj: Record<string, string[]>;
  
  try {
    if (typeof availability === 'string') {
      availabilityObj = JSON.parse(availability);
    } else {
      availabilityObj = availability as Record<string, string[]>;
    }
  } catch {
    // En cas d'erreur, afficher quand même le texte
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span className="text-gray-700">{String(availability)}</span>
      </div>
    );
  }

  // Traduction des jours
  const dayTranslations: Record<string, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  };

  // Ordre des jours
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Trier les jours selon l'ordre de la semaine
  const sortedDays = Object.keys(availabilityObj).sort((a, b) => {
    const indexA = dayOrder.indexOf(a.toLowerCase());
    const indexB = dayOrder.indexOf(b.toLowerCase());
    return indexA - indexB;
  });

  // Formater une heure (14:00 -> 14h00)
  const formatTime = (time: string) => {
    return time.replace(':', 'h');
  };

  if (compact) {
    // Version compacte : affichage sur une ligne
    const days = sortedDays
      .map(day => dayTranslations[day.toLowerCase()] || day)
      .join(', ');
    
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span className="text-gray-700">{days}</span>
      </div>
    );
  }

  // Version complète : affichage détaillé
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-purple-600" />
        <h4 className="font-semibold text-gray-800">Disponibilités</h4>
      </div>
      <div className="space-y-2">
        {sortedDays.map(day => {
          const slots = availabilityObj[day];
          const dayName = dayTranslations[day.toLowerCase()] || day;
          
          return (
            <div key={day} className="flex items-start gap-2">
              <span className="font-medium text-gray-700 min-w-[80px]">
                {dayName}
              </span>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm"
                  >
                    {formatTime(slot)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export d'une version inline pour les cas où on veut juste le texte
export function getAvailabilityText(availability: string | object | null): string {
  if (!availability) return 'Non renseigné';

  try {
    let availabilityObj: Record<string, string[]>;
    
    if (typeof availability === 'string') {
      availabilityObj = JSON.parse(availability);
    } else {
      availabilityObj = availability as Record<string, string[]>;
    }

    const dayTranslations: Record<string, string> = {
      lundi: 'Lun',
      mardi: 'Mar',
      mercredi: 'Mer',
      jeudi: 'Jeu',
      vendredi: 'Ven',
      samedi: 'Sam',
      dimanche: 'Dim',
    };

    const days = Object.keys(availabilityObj)
      .map(day => dayTranslations[day.toLowerCase()] || day)
      .join(', ');

    return days;
  } catch {
    return 'Format invalide';
  }
}