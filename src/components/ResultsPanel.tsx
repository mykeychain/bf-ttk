import { useState, useMemo } from 'react';
import type { WeaponWithName } from '../types';
import { ResultsDisplay } from './ResultsDisplay';
import { ComparisonTable } from './ComparisonTable';
import { evaluate_weapon_minimal, makeRng, hashString, type EvalResult } from '../ttk';
import './ResultsPanel.css';

interface ResultsPanelProps {
  selectedWeapons: WeaponWithName[];
  playerSkill: number;
}

type TabType = 'profile' | 'ttk' | 'ettk';

export interface WeaponResults {
  weapon: WeaponWithName;
  resultsByDistance: Map<number, EvalResult>;
}

export function ResultsPanel({ selectedWeapons, playerSkill }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Calculate all results once and cache them
  const weaponResults = useMemo<WeaponResults[]>(() => {
    return selectedWeapons.map(weapon => {
      const distances = Object.keys(weapon.damage).map(Number).sort((a, b) => a - b);
      const resultsByDistance = new Map<number, EvalResult>();

      distances.forEach(distance => {
        const damage_per_hit = weapon.damage[distance.toString()];

        // Create deterministic seed
        const seedString = `${weapon.name}-${distance}-${playerSkill.toFixed(2)}`;
        const seed = hashString(seedString);
        const rng = makeRng(seed);

        const results = evaluate_weapon_minimal({
          damage_per_hit,
          RPM: weapon.rpm,
          distance,
          precision_raw: weapon.precision,
          control_raw: weapon.control,
          sigma_player_deg: playerSkill,
          rng,
        });

        resultsByDistance.set(distance, results);
      });

      return { weapon, resultsByDistance };
    });
  }, [selectedWeapons, playerSkill]);

  if (selectedWeapons.length === 0) {
    return null;
  }

  return (
    <div className="results-panel">
      <div className="tab-selector">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          WEAPON PROFILE
        </button>
        <button
          className={`tab-button ${activeTab === 'ttk' ? 'active' : ''}`}
          onClick={() => setActiveTab('ttk')}
        >
          TTK
        </button>
        <button
          className={`tab-button ${activeTab === 'ettk' ? 'active' : ''}`}
          onClick={() => setActiveTab('ettk')}
        >
          ETTK
        </button>
      </div>

      <div className="tab-content">
        <div className={`profile-view ${activeTab === 'profile' ? 'active' : ''}`}>
          {weaponResults.map(weaponResult => (
            <ResultsDisplay
              key={weaponResult.weapon.name}
              weaponResult={weaponResult}
            />
          ))}
        </div>

        <div className={activeTab === 'ttk' ? 'active' : ''}>
          <ComparisonTable
            weaponResults={weaponResults}
            metric="TTK"
          />
        </div>

        <div className={activeTab === 'ettk' ? 'active' : ''}>
          <ComparisonTable
            weaponResults={weaponResults}
            metric="ETTK"
          />
        </div>
      </div>
    </div>
  );
}
