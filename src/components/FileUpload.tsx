'use client';

import { useState } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export default function FileUpload({ 
  onFileSelect, 
  onCancel,
  acceptedTypes = 'image/*,application/pdf,.zip,.rar,.doc,.docx',
  maxSizeMB = 10 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Le fichier est trop volumineux (max ${maxSizeMB}MB)`);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Créer une prévisualisation pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSend = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleCancelLocal = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    onCancel();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Envoyer un fichier</h3>
          <button
            onClick={handleCancelLocal}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!selectedFile ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100 transition">
            <Upload className="w-12 h-12 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Cliquez pour sélectionner un fichier</p>
            <p className="text-xs text-gray-500">Images, PDF, ZIP, DOC (max {maxSizeMB}MB)</p>
            <input
              type="file"
              className="hidden"
              accept={acceptedTypes}
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {preview ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={preview}
                  alt="Aperçu"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileIcon className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelLocal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}