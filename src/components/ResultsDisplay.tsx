import type { EvalResult } from '../ttk';
import type { WeaponResults } from './ResultsPanel';
import './ResultsDisplay.css';

interface ResultsDisplayProps {
  weaponResult: WeaponResults;
}

interface DistanceResult {
  distance: number;
  results: EvalResult;
}

export function ResultsDisplay({ weaponResult }: ResultsDisplayProps) {
  const { weapon, resultsByDistance } = weaponResult;

  // Convert Map to array for rendering
  const distanceResults: DistanceResult[] = Array.from(resultsByDistance.entries())
    .map(([distance, results]) => ({ distance, results }))
    .sort((a, b) => a.distance - b.distance);

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
              <th>DISTANCE</th>
              <th>DAMAGE</th>
              <th>TTK</th>
              <th>ETTK</th>
              <th>AVG SHOTS</th>
              <th>MISSES</th>
              <th>ACCURACY</th>
            </tr>
          </thead>
          <tbody>
            {distanceResults.map(({ distance, results }) => (
              <tr key={distance}>
                <td>{distance}m</td>
                <td>{weapon.damage[distance.toString()]}</td>
                <td>{results.TTK.toFixed(3)}s</td>
                <td>{results.ETTK.toFixed(3)}s</td>
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
