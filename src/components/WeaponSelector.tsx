import { WeaponCard } from './WeaponCard';
import { SkillSlider } from './SkillSlider';
import type { WeaponWithName } from '../types';
import './WeaponSelector.css';

interface WeaponSelectorProps {
  weapons: WeaponWithName[];
  selectedWeapons: string[];
  onSelectWeapon: (weaponName: string) => void;
  onClearSelection: () => void;
  playerSkill: number;
  onSkillChange: (skill: number) => void;
}

export function WeaponSelector({ weapons, selectedWeapons, onSelectWeapon, onClearSelection, playerSkill, onSkillChange }: WeaponSelectorProps) {

  // Group weapons by category
  const weaponsByCategory = weapons.reduce((acc, weapon) => {
    if (!acc[weapon.category]) {
      acc[weapon.category] = [];
    }
    acc[weapon.category].push(weapon);
    return acc;
  }, {} as Record<string, WeaponWithName[]>);

  // Define category order
  const categoryOrder = ['assault rifle', 'carbine', 'smg', 'lmg', 'dmr'];

  return (
    <div className="weapon-selector">
      <h1>Battlefield TTK Calculator</h1>

      <SkillSlider value={playerSkill} onChange={onSkillChange} />

      <button
        className="clear-selection-button"
        onClick={onClearSelection}
        disabled={selectedWeapons.length === 0}
      >
        CLEAR SELECTION
      </button>

      {categoryOrder.map((category) => {
        const categoryWeapons = weaponsByCategory[category];
        if (!categoryWeapons || categoryWeapons.length === 0) return null;

        return (
          <div key={category} className="weapon-category">
            <h2 className="category-title">
              {category.toUpperCase()}
            </h2>
            <div className="weapon-grid">
              {categoryWeapons.map((weapon) => (
                <WeaponCard
                  key={weapon.name}
                  name={weapon.name}
                  selected={selectedWeapons.includes(weapon.name)}
                  onClick={() => onSelectWeapon(weapon.name)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
