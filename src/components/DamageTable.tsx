import type { WeaponWithName } from '../types';
import './ComparisonTable.css';

interface DamageTableProps {
  weapons: WeaponWithName[];
}

interface WeaponDamage {
  weaponName: string;
  damageByDistance: Map<number, number>;
}

export function DamageTable({ weapons }: DamageTableProps) {
  // Collect all unique distances across all weapons
  const distanceSet = new Set<number>();
  weapons.forEach(weapon => {
    Object.keys(weapon.damage).forEach(dist => {
      distanceSet.add(Number(dist));
    });
  });
  const allDistances = Array.from(distanceSet).sort((a, b) => a - b);

  // Extract damage values from weapon data
  const weaponDamages: WeaponDamage[] = weapons.map(weapon => {
    const damageByDistance = new Map<number, number>();

    allDistances.forEach(distance => {
      const distanceKey = distance.toString();
      if (weapon.damage[distanceKey] !== undefined) {
        damageByDistance.set(distance, weapon.damage[distanceKey]);
      }
    });

    return {
      weaponName: weapon.name,
      damageByDistance,
    };
  });

  if (weapons.length === 0) {
    return null;
  }

  // Calculate max damage for each distance column
  const maxDamageByDistance = new Map<number, number>();
  allDistances.forEach(distance => {
    let maxDamage = -Infinity;
    weaponDamages.forEach(({ damageByDistance }) => {
      const damage = damageByDistance.get(distance);
      if (damage !== undefined && damage > maxDamage) {
        maxDamage = damage;
      }
    });
    if (maxDamage !== -Infinity) {
      maxDamageByDistance.set(distance, maxDamage);
    }
  });

  return (
    <div className="comparison-table-container">
      <h2 className="comparison-title">DAMAGE COMPARISON</h2>
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
            {weaponDamages.map(({ weaponName, damageByDistance }) => (
              <tr key={weaponName}>
                <td className="weapon-name-cell">{weaponName}</td>
                {allDistances.map(distance => {
                  const damage = damageByDistance.get(distance);
                  const maxDamage = maxDamageByDistance.get(distance);
                  const isHighlighted = damage !== undefined && damage === maxDamage;
                  return (
                    <td key={distance} className={isHighlighted ? 'highlight-best' : ''}>
                      {damage !== undefined ? damage : '—'}
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
