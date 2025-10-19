import { useMemo } from 'react';
import type { WeaponWithName } from '../types';
import { evaluate_weapon_minimal, makeRng, hashString, type EvalResult } from '../ttk';
import './ResultsDisplay.css';

interface ResultsDisplayProps {
  weapon: WeaponWithName;
  playerSkill: number; // sigma_player_deg
}

interface DistanceResult {
  distance: number;
  results: EvalResult;
}

export function ResultsDisplay({ weapon, playerSkill }: ResultsDisplayProps) {
  const distanceResults = useMemo<DistanceResult[]>(() => {
    const distances = Object.keys(weapon.damage).map(Number).sort((a, b) => a - b);

    return distances.map(distance => {
      const damage_per_hit = weapon.damage[distance.toString()];

      // Create deterministic seed from weapon name, distance, and player skill
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
        rng, // Pass seeded RNG for deterministic results
        // Uses defaults: HP=100, target_radius=0.25, trials=100, kill_window=1.0
      });

      return { distance, results };
    });
  }, [weapon, playerSkill]);

  return (
    <div className="results-display">
      <div className="results-header">
        <h2 className="results-title">{weapon.name}</h2>
        <div className="weapon-stats">
          <span className="stat-item">Precision: {weapon.precision}</span>
          <span className="stat-divider">|</span>
          <span className="stat-item">Control: {weapon.control}</span>
          <span className="stat-divider">|</span>
          <span className="stat-item">RPM: {weapon.rpm}</span>
        </div>
      </div>

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Distance (m)</th>
              <th>Damage</th>
              <th>ETTK (s)</th>
              <th>TTK90 (s)</th>
              <th>Avg Shots</th>
              <th>Misses</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {distanceResults.map(({ distance, results }) => (
              <tr key={distance}>
                <td>{distance}m</td>
                <td>{weapon.damage[distance.toString()]}</td>
                <td>{results.ETTK.toFixed(3)}</td>
                <td>{results.TTK90.toFixed(3)}</td>
                <td>{results.avgShots.toFixed(1)}</td>
                <td>{results.avgMisses.toFixed(1)}</td>
                <td>{(results.accuracy * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
