import { useState } from 'react';
import './GoalSetupModal.css';

export default function GoalSetupModal({ year, onSet, onSkip }) {
  const [value, setValue] = useState('20');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const goal = parseInt(value, 10);
    if (!Number.isInteger(goal) || goal < 1) {
      setError('Enter a whole number of at least 1');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSet(goal);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="goal-modal-backdrop">
      <div className="goal-modal">
        <h2>Set your {year} reading goal</h2>
        <p>How many books do you want to read this year? You can change this anytime in your Profile.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {error && <p className="goal-modal-error" role="alert">{error}</p>}
          <div className="goal-modal-actions">
            <button type="button" className="goal-modal-skip" onClick={onSkip}>
              Skip for now
            </button>
            <button type="submit" className="goal-modal-submit" disabled={saving}>
              {saving ? 'Saving…' : 'Set goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
