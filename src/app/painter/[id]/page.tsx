'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PainterRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const painterId = params.id as string;

  useEffect(() => {
    router.replace(`/painter/${painterId}/profile`);
  }, [painterId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}