import type { WeaponResults } from './ResultsPanel';
import './ComparisonTable.css';

interface ComparisonTableProps {
  weaponResults: WeaponResults[];
  metric: 'TTK' | 'ETTK';
}

interface WeaponMetrics {
  weaponName: string;
  valuesByDistance: Map<number, number>;
  accuracyByDistance: Map<number, number>;
}

export function ComparisonTable({ weaponResults, metric }: ComparisonTableProps) {
  // Collect all unique distances across all weapons
  const distanceSet = new Set<number>();
  weaponResults.forEach(({ resultsByDistance }) => {
    resultsByDistance.forEach((_, distance) => {
      distanceSet.add(distance);
    });
  });
  const allDistances = Array.from(distanceSet).sort((a, b) => a - b);

  // Extract the specific metric from pre-calculated results
  const weaponMetrics: WeaponMetrics[] = weaponResults.map(({ weapon, resultsByDistance }) => {
    const valuesByDistance = new Map<number, number>();
    const accuracyByDistance = new Map<number, number>();

    resultsByDistance.forEach((results, distance) => {
      valuesByDistance.set(distance, results[metric]);
      accuracyByDistance.set(distance, results.accuracy);
    });

    return {
      weaponName: weapon.name,
      valuesByDistance,
      accuracyByDistance,
    };
  });

  if (weaponResults.length === 0) {
    return null;
  }

  return (
    <div className="comparison-table-container">
      <h2 className="comparison-title">
        {metric === 'ETTK' ? 'ETTK COMPARISON WITH ACCURACY' : `${metric} COMPARISON`}
      </h2>
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>WEAPON</th>
              {allDistances.map(distance => (
                <th key={distance}>{distance}M</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weaponMetrics.map(({ weaponName, valuesByDistance, accuracyByDistance }) => (
              <tr key={weaponName}>
                <td className="weapon-name-cell">{weaponName}</td>
                {allDistances.map(distance => {
                  const value = valuesByDistance.get(distance);
                  const accuracy = accuracyByDistance.get(distance);
                  return (
                    <td key={distance}>
                      {value !== undefined
                        ? metric === 'ETTK' && accuracy !== undefined
                          ? `${value.toFixed(3)}s (${(accuracy * 100).toFixed(1)}%)`
                          : `${value.toFixed(3)}s`
                        : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
