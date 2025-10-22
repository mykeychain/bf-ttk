import { useState } from 'react';
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
  onOpenHelp: () => void;
}

export function WeaponSelector({ weapons, selectedWeapons, onSelectWeapon, onClearSelection, playerSkill, onSkillChange, onOpenHelp }: WeaponSelectorProps) {
  // Track collapsed state for each category (false = expanded, true = collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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

  // Toggle category collapsed state
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="weapon-selector">
      <div className="header-row">
        <h1>Battlefield TTK Calculator</h1>
        <button className="help-button" onClick={onOpenHelp} aria-label="Help">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2"/>
            <text x="14" y="19" fontSize="16" fontWeight="700" fill="currentColor" textAnchor="middle">?</text>
          </svg>
        </button>
      </div>

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

        const isCollapsed = collapsedCategories[category] || false;

        return (
          <div key={category} className="weapon-category">
            <div className="category-header-row">
              <h2 className="category-title">
                {category.toUpperCase()}
              </h2>
              <button
                className="category-toggle-button"
                onClick={() => toggleCategory(category)}
                aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
              >
                {isCollapsed ? '+' : '−'}
              </button>
            </div>
            <div className={`weapon-grid-wrapper ${isCollapsed ? 'weapon-grid-collapsed' : 'weapon-grid-expanded'}`}>
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
          </div>
        );
      })}

      <footer className="weapon-selector-footer">
        <p className="disclaimer-text">This is a fan-made project and is not affiliated with DICE or EA</p>
        <a
          href="https://github.com/mykeychain/bf-ttk"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
