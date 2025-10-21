import { useState, useEffect, useMemo } from 'react';
import type { WeaponWithName } from '../types';
import { ResultsDisplay } from './ResultsDisplay';
import { ComparisonTable } from './ComparisonTable';
import { DamageTable } from './DamageTable';
import { evaluate_weapon_minimal, makeRng, hashString, type EvalResult } from '../ttk';
import './ResultsPanel.css';

interface ResultsPanelProps {
  selectedWeapons: WeaponWithName[];
  playerSkill: number;
}

type TabType = 'profile' | 'dmg' | 'ttk' | 'ettk';

export interface WeaponResults {
  weapon: WeaponWithName;
  resultsByDistance: Map<number, EvalResult>;
}

export function ResultsPanel({ selectedWeapons, playerSkill }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [resultsCache, setResultsCache] = useState<Map<string, WeaponResults>>(new Map());

  // Update cache when weapons or skill changes - only calculate new weapons
  useEffect(() => {
    setResultsCache(prevCache => {
      const newCache = new Map(prevCache);

      // Calculate results only for weapons not in cache
      selectedWeapons.forEach(weapon => {
        const cacheKey = `${weapon.name}-${playerSkill.toFixed(2)}`;

        if (!newCache.has(cacheKey)) {
          // Only calculate if not cached
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

          newCache.set(cacheKey, { weapon, resultsByDistance });
        }
      });

      // Clean up cache entries for deselected weapons to keep memory bounded
      const currentKeys = new Set(selectedWeapons.map(w => `${w.name}-${playerSkill.toFixed(2)}`));
      for (const key of newCache.keys()) {
        if (!currentKeys.has(key)) {
          newCache.delete(key);
        }
      }

      return newCache;
    });
  }, [selectedWeapons, playerSkill]);

  // Derive weaponResults from cache in selection order
  const weaponResults = useMemo(() => {
    return selectedWeapons
      .map(weapon => {
        const cacheKey = `${weapon.name}-${playerSkill.toFixed(2)}`;
        return resultsCache.get(cacheKey);
      })
      .filter((result): result is WeaponResults => result !== undefined);
  }, [selectedWeapons, playerSkill, resultsCache]);

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
          className={`tab-button ${activeTab === 'dmg' ? 'active' : ''}`}
          onClick={() => setActiveTab('dmg')}
        >
          DMG
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
        {weaponResults.length === 0 ? (
          <div className="empty-state">
            Select a weapon to view analysis
          </div>
        ) : (
          <>
            <div className={`profile-view ${activeTab === 'profile' ? 'active' : ''}`}>
              {weaponResults.map(weaponResult => (
                <ResultsDisplay
                  key={weaponResult.weapon.name}
                  weaponResult={weaponResult}
                />
              ))}
            </div>

            <div className={activeTab === 'dmg' ? 'active' : ''}>
              <DamageTable weapons={selectedWeapons} />
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
          </>
        )}
      </div>
    </div>
  );
}
