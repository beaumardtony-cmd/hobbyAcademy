'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Painter {
  id: string;
  name: string;
  bio: string;
  location: string;
  hourly_rate: number;
  availability: string;
  profile_image_url: string;
  status: string;
  submitted_date: string;
  rejection_reason?: string;
  styles: string[];
  levels: string[];
}

export default function AdminPage() {
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPainter, setSelectedPainter] = useState<Painter | null>(null);

  useEffect(() => {
    fetchAllPainters();
  }, []);

  const fetchAllPainters = async () => {
    try {
      const { data: paintersData, error: paintersError } = await supabase
        .from('painters')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (paintersError) throw paintersError;

      const paintersWithDetails = await Promise.all(
        (paintersData || []).map(async (painter) => {
          const { data: stylesData } = await supabase
            .from('painter_styles')
            .select('style')
            .eq('painter_id', painter.id);

          const { data: levelsData } = await supabase
            .from('painter_levels')
            .select('level')
            .eq('painter_id', painter.id);

          return {
            ...painter,
            styles: stylesData?.map(s => s.style) || [],
            levels: levelsData?.map(l => l.level) || []
          };
        })
      );

      setPainters(paintersWithDetails);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvePainter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('painters')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      setPainters(painters.map(p => 
        p.id === id ? { ...p, status: 'approved' } : p
      ));
      alert('Formateur approuvé avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const rejectPainter = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Veuillez indiquer une raison de rejet');
      return;
    }

    try {
      const { error } = await supabase
        .from('painters')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason 
        })
        .eq('id', id);

      if (error) throw error;

      setPainters(painters.map(p => 
        p.id === id ? { ...p, status: 'rejected', rejection_reason: rejectionReason } : p
      ));
      setRejectionReason('');
      setSelectedPainter(null);
      alert('Formateur rejeté');
    } catch (error) {
      console.error