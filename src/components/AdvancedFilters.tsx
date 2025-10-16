'use client';

import { X, SlidersHorizontal } from 'lucide-react';

interface FilterSettings {
  minRating: number;
  sortBy: string;
  hasPortfolio: boolean;
  hasReviews: boolean;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterSettings;
  onFiltersChange: (filters: FilterSettings) => void;
}

export default function AdvancedFilters({ isOpen, onClose, filters, onFiltersChange }: AdvancedFiltersProps) {
  if (!isOpen) return null;

  const handleFilterChange = <K extends keyof FilterSettings>(key: K, value: FilterSettings[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      minRating: 0,
      sortBy: 'recent',
      hasPortfolio: false,
      hasReviews: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Filtres avancés</h2>
        </div>

        <div className="space-y-6">
          {/* Note minimum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Note minimum
            </label>
            <div className="flex gap-2">
              {[0, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('minRating', rating)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                    filters.minRating === rating
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 0 ? 'Tous' : `${rating}+ ⭐`}
                </button>
              ))}
            </div>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trier par
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            >
              <option value="recent">Plus récents</option>
              <option value="rating">Meilleure note</option>
              <option value="reviews">Plus d&apos;avis</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>

          {/* Options supplémentaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Options supplémentaires
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPortfolio}
                  onChange={(e) => handleFilterChange('hasPortfolio', e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Avec portfolio uniquement</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasReviews}
                  onChange={(e) => handleFilterChange('hasReviews', e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Avec avis uniquement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}