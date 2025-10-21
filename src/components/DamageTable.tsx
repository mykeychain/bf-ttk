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
                  return (
                    <td key={distance}>
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
