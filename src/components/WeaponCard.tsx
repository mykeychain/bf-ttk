import './WeaponCard.css';

interface WeaponCardProps {
  name: string;
  selected: boolean;
  onClick: () => void;
}

export function WeaponCard({ name, selected, onClick }: WeaponCardProps) {
  return (
    <div
      className={`weapon-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="weapon-name">{name}</div>
    </div>
  );
}
