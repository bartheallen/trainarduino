"use client";

import { useState } from 'react';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { CircuitChipIcon } from '@/components/ui/ElectronicsIcons';

export function WokwiHelpPanel(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <PrimitiveCard tone="glass" className="p-3"> 
      <div className="flex items-center justify-between"> 
        <div className="flex items-center gap-3"> 
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/8 text-cyan-200">
            <CircuitChipIcon className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            className="flex items-center gap-2 text-left"
          >
            <span className="text-sm font-semibold text-white">❓ Comment utiliser Wokwi ?</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? 'Réduire' : 'Ouvrir'}
          className={`transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'} text-slate-300`}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={`mt-3 overflow-hidden transition-all duration-200 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300"> 
          <li>
            <strong>Ajouter un composant :</strong> cliquez sur le bouton «+» en haut à gauche de Wokwi, puis recherchez le composant souhaité (par exemple LED, resistor, pushbutton, potentiometer) dans la bibliothèque.
          </li>
          <li>
            <strong>Câbler le circuit :</strong> cliquez sur une broche, puis glissez jusqu&apos;à une autre broche pour créer un fil de connexion.
          </li>
          <li>
            <strong>Lancer la simulation :</strong> cliquez sur le bouton ▶️ (play) en haut à gauche de l&apos;écran Wokwi.
          </li>
          <li>
            <strong>Modifier le circuit :</strong> cliquez sur le bouton stop (■), ajustez le câblage ou les composants, puis relancez la simulation.
          </li>
        </ol>
      </div>
    </PrimitiveCard>
  );
}

export default WokwiHelpPanel;
