import './WelcomeModal.css';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>
        <h2 className="modal-header">What is ETTK??</h2>
        <div className="modal-body">
          <p>
            <strong>TTK (Time To Kill)</strong> is the fastest time to kill an enemy with <strong>100% accuracy</strong>.
          </p>
          <p>
            <strong>ETTK (Expected Time To Kill)</strong> is the <em>realistic</em> time to kill
            that accounts for:
          </p>
          <ul>
            <li>Missed shots from weapon spread</li>
            <li>Recoil and bloom</li>
            <li>Distance to target</li>
            <li>Your weapon control</li>
          </ul>
          <p>
            ETTK gives you a more accurate comparison of how weapons actually perform in combat,
            not just on paper. A weapon with lower TTK but poor accuracy might have a higher ETTK
            than a more accurate weapon with slightly higher TTK.
          </p>
          <p className="modal-tip">
            <strong>Tip:</strong> Select multiple weapons to compare them side-by-side!
          </p>
        </div>
      </div>
    </div>
  );
}
