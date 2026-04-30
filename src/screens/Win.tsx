type Props = {
  speed: number;
  best: number;
  onAgain: () => void;
  onMenu: () => void;
};

export function Win({ speed, best, onAgain, onMenu }: Props) {
  const isBest = speed >= best;
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>Direct hit!</h2>
        <p className="lead">{isBest ? "New personal best 🏁" : "Nice shot — line up another."}</p>
        <div className="speed">{speed.toFixed(1)} m/s</div>
        <button className="btn btn-primary" onClick={onAgain}>Send another</button>
        <button className="btn btn-ghost" onClick={onMenu}>Main menu</button>
      </div>
    </div>
  );
}
