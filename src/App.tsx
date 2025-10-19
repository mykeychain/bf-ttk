import { useState, useEffect } from 'react'
import { WeaponSelector } from './components/WeaponSelector'
import { ResultsPanel } from './components/ResultsPanel'
import type { WeaponDatabase, WeaponWithName } from './types'
import './App.css'

function App() {
  const [weapons, setWeapons] = useState<WeaponWithName[]>([])
  const [selectedWeaponNames, setSelectedWeaponNames] = useState<string[]>([])
  const [playerSkill, setPlayerSkill] = useState(0.1) // sigma_player_deg

  useEffect(() => {
    // Load weapons from JSON
    fetch('/weapons.json')
      .then((res) => res.json())
      .then((data: WeaponDatabase) => {
        const weaponArray: WeaponWithName[] = Object.entries(data).map(([name, weapon]) => ({
          name,
          ...weapon,
        }))
        setWeapons(weaponArray)
      })
      .catch((err) => console.error('Failed to load weapons:', err))
  }, [])

  // Toggle weapon selection (add if not selected, remove if already selected)
  const toggleWeaponSelection = (weaponName: string) => {
    setSelectedWeaponNames(prev =>
      prev.includes(weaponName)
        ? prev.filter(name => name !== weaponName)
        : [...prev, weaponName]
    )
  }

  // Clear all selected weapons
  const clearSelection = () => {
    setSelectedWeaponNames([])
  }

  const selectedWeapons = selectedWeaponNames
    .map(name => weapons.find(w => w.name === name))
    .filter((weapon): weapon is WeaponWithName => weapon !== undefined)

  return (
    <div className="app">
      <div className="app-left">
        <WeaponSelector
          weapons={weapons}
          selectedWeapons={selectedWeaponNames}
          onSelectWeapon={toggleWeaponSelection}
          onClearSelection={clearSelection}
          playerSkill={playerSkill}
          onSkillChange={setPlayerSkill}
        />
      </div>
      <div className="app-right">
        <ResultsPanel selectedWeapons={selectedWeapons} playerSkill={playerSkill} />
      </div>
    </div>
  )
}

export default App
