# Battlefield TTK Calculator

A web-based tool for calculating and comparing Expected Time To Kill (ETTK) for Battlefield weapons across different ranges and player skill levels.

Try out the live demo **[HERE](https://bfttk.surge.sh)**

## What is ETTK?

**TTK (Time To Kill)** is the theoretical fastest time to kill an enemy with 100% accuracy—assuming every shot hits.

**ETTK (Expected Time To Kill)** is the realistic time to kill that accounts for:
- Missed shots from weapon spread
- Recoil and bloom
- Distance to target
- Player skill level
- Weapon control characteristics

ETTK provides a more accurate comparison of how weapons actually perform in combat, not just on paper. A weapon with lower TTK but poor accuracy might have a higher ETTK than a more accurate weapon with slightly higher TTK.

## Features

- **Multi-weapon comparison**: Select and compare multiple weapons side-by-side
- **Player skill modeling**: Adjust your skill level to see personalized results
- **Distance-based analysis**: Compare weapon performance at different engagement ranges
- **Realistic ballistics simulation**:
  - Weapon precision (bloom/spread)
  - Weapon control (recoil drift)
  - Stochastic accuracy modeling
- **Interactive visualizations**: Weapon profiles, damage tables, TTK and ETTK comparisons
- **Accuracy metrics**: See predicted hit rates for each weapon at various ranges

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Custom TTK Model** - Monte Carlo simulation for realistic ballistics

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bfttk

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
bfttk/
├── public/
│   ├── crosshair.svg      # App favicon
│   └── weapons.json       # Weapon stats database
├── src/
│   ├── components/        # React components
│   │   ├── ComparisonTable.tsx
│   │   ├── DamageTable.tsx
│   │   ├── ResultsDisplay.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── SkillSlider.tsx
│   │   ├── WeaponCard.tsx
│   │   ├── WeaponSelector.tsx
│   │   └── WelcomeModal.tsx
│   ├── App.tsx            # Main app component
│   ├── ttk.ts             # TTK/ETTK calculation engine
│   ├── types.ts           # TypeScript type definitions
│   └── index.css          # Global styles
└── index.html             # Entry point
```

## How It Works

The calculator uses a Monte Carlo simulation approach to model realistic weapon behavior:

1. **Weapon Stats**: Each weapon has precision, control, RPM, and damage values
2. **Player Skill**: Modeled as aim jitter/uncertainty (sigma_player)
3. **Spread Modeling**:
   - Base spread (sigma0)
   - Per-shot bloom (varies with precision)
   - Recoil drift (varies with control)
4. **Hit Probability**: Calculated per-shot using weapon spread + player skill
5. **ETTK Calculation**: Runs multiple trials to determine expected time to kill

### Key Model Parameters

- **Precision** → Controls random bullet spread (bloom)
- **Control** → Controls recoil pattern magnitude (drift)
- **Player Skill** → Affects aim consistency and drift compensation
- **Distance** → Affects angular target size and hit probability

## Disclaimer

This project is a fan-made tool created for educational and analytical purposes. It is not affiliated with, endorsed by, or connected to DICE, EA, or the Battlefield franchise in any way. All weapon names and game references are the property of their respective owners.
