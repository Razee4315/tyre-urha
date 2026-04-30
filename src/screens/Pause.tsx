type Props = {
  onResume: () => void;
  onMenu: () => void;
};

export function Pause({ onResume, onMenu }: Props) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>Paused</h2>
        <p className="lead">Take a breath. The tyre will wait.</p>
        <button className="btn btn-primary" onClick={onResume}>Resume</button>
        <button className="btn btn-ghost" onClick={onMenu}>Main menu</button>
      </div>
    </div>
  );
}
