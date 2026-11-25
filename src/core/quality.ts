// PerformanceManager: os quatro níveis de qualidade do blueprint (seção 18).

import { useExperience, type Quality } from '../stores/useExperience';

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  post: boolean;      // bloom + vinheta
  ao: boolean;        // oclusão de ambiente (N8AO)
  extraLights: boolean; // velas e luzes secundárias
  antialias: boolean;
}

export const QUALITY: Record<Quality, QualitySettings> = {
  economico: { dpr: [0.75, 1], shadows: false, post: false, ao: false, extraLights: false, antialias: false },
  medio: { dpr: [1, 1.5], shadows: false, post: true, ao: false, extraLights: true, antialias: true },
  alto: { dpr: [1, 2], shadows: true, post: true, ao: false, extraLights: true, antialias: true },
  cinematografico: { dpr: [1, 2], shadows: true, post: true, ao: true, extraLights: true, antialias: true },
};

export const useQuality = () => QUALITY[useExperience((s) => s.quality)];
