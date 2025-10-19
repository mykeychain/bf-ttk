import { useState, useEffect } from 'react';
import './SkillSlider.css';

interface SkillSliderProps {
  value: number; // sigma_player_deg (0.01 to 0.30)
  onChange: (value: number) => void;
}

export function SkillSlider({ value, onChange }: SkillSliderProps) {
  // Local state for smooth dragging without triggering expensive recalculations
  const [localValue, setLocalValue] = useState(value);

  // Sync local state when prop changes (e.g., reset to default)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Invert the slider so Casual (0.30) is on left, Pro (0.01) is on right
  // Internal slider goes 1 to 30, representing the inverted scale
  const sliderValue = Math.round((0.31 - localValue) * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderValue = parseInt(e.target.value);
    const actualSigma = (31 - newSliderValue) / 100;
    setLocalValue(actualSigma); // Update local state for smooth UI feedback
  };

  const handleRelease = () => {
    onChange(localValue); // Trigger expensive recalculation only on release
  };

  return (
    <div className="skill-slider-wrapper">
      <h3 className="skill-slider-title">How well do you handle recoil?</h3>
      <div className="skill-slider">
        <div className="skill-slider-labels">
          <span className="skill-label skill-label-casual">Casual</span>
          <span className="skill-label skill-label-average">Average</span>
          <span className="skill-label skill-label-advanced">Advanced</span>
          <span className="skill-label skill-label-pro">Pro</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={sliderValue}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="skill-slider-input"
        />
        <div className="skill-slider-value">
          Player Skill: {localValue.toFixed(2)}° jitter
        </div>
      </div>
    </div>
  );
}
