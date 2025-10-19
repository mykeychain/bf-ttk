import { useState, useEffect } from 'react'
import { WeaponSelector } from './components/WeaponSelector'
import { ResultsDisplay } from './components/ResultsDisplay'
import type { WeaponDatabase, WeaponWithName } from './types'
import './App.css'

function App() {
  const [weapons, setWeapons] = useState<WeaponWithName[]>([])
  const [selectedWeaponName, setSelectedWeaponName] = useState<string | null>(null)
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

  const selectedWeapon = weapons.find(w => w.name === selectedWeaponName)

  return (
    <div className="app">
      <div className="app-left">
        <WeaponSelector
          weapons={weapons}
          selectedWeapon={selectedWeaponName}
          onSelectWeapon={setSelectedWeaponName}
          playerSkill={playerSkill}
          onSkillChange={setPlayerSkill}
        />
      </div>
      <div className="app-right">
        {selectedWeapon && <ResultsDisplay weapon={selectedWeapon} playerSkill={playerSkill} />}
      </div>
    </div>
  )
}

export default App
