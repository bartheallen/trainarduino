'use client';

import { createContext, useContext, ReactNode } from 'react';
import { designTokens, surfaceLevels, motionPresets } from './tokens';

const DesignSystemContext = createContext({
  tokens: designTokens,
  surfaceLevels,
  motionPresets,
});

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  return <DesignSystemContext.Provider value={{ tokens: designTokens, surfaceLevels, motionPresets }}>{children}</DesignSystemContext.Provider>;
}

export function useDesignSystem() {
  return useContext(DesignSystemContext);
}
