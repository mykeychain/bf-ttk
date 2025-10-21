import { useState, useEffect } from 'react'
import { WeaponSelector } from './components/WeaponSelector'
import { ResultsPanel } from './components/ResultsPanel'
import { WelcomeModal } from './components/WelcomeModal'
import type { WeaponDatabase, WeaponWithName } from './types'
import './App.css'

function App() {
  const [weapons, setWeapons] = useState<WeaponWithName[]>([])
  const [selectedWeaponNames, setSelectedWeaponNames] = useState<string[]>([])
  const [playerSkill, setPlayerSkill] = useState(0.1) // sigma_player_deg
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Check if user has seen the welcome modal
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('ettk-welcome-seen')
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true)
    }
  }, [])

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

  // Close welcome modal and mark as seen
  const handleCloseWelcomeModal = () => {
    localStorage.setItem('ettk-welcome-seen', 'true')
    setShowWelcomeModal(false)
  }

  const selectedWeapons = selectedWeaponNames
    .map(name => weapons.find(w => w.name === name))
    .filter((weapon): weapon is WeaponWithName => weapon !== undefined)

  return (
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />
      <div className="app">
        <div className="app-left">
          <WeaponSelector
            weapons={weapons}
            selectedWeapons={selectedWeaponNames}
            onSelectWeapon={toggleWeaponSelection}
            onClearSelection={clearSelection}
            playerSkill={playerSkill}
            onSkillChange={setPlayerSkill}
            onOpenHelp={() => setShowWelcomeModal(true)}
          />
        </div>
        <div className="app-right">
          <ResultsPanel selectedWeapons={selectedWeapons} playerSkill={playerSkill} />
        </div>
      </div>
    </>
  )
}

export default App
