import { useEffect, useState } from 'react';
import { changePassword, getProfile, updateProfile } from '../api';
import ThemeBar from '../components/ThemeBar';
import DateFields from '../components/DateFields';
import './ProfilePage.css';

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'self-describe', label: 'Prefer to self-describe' },
];
const GENDER_PRESETS = ['', 'woman', 'man', 'non-binary'];

function formToState(user) {
  const gender = user.gender || '';
  return {
    name: user.name || '',
    email: user.email || '',
    date_of_birth: user.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
    gender,
    country: user.country || '',
  };
}

function isProfileFilledOut(form) {
  return Boolean(form.name || form.date_of_birth || form.gender || form.country);
}

function formatDate(value) {
  if (!value) return null;
  // Parse the YYYY-MM-DD calendar date as local components (no Date(string) /
  // UTC parsing), since a date of birth has no time-of-day or timezone to shift.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function genderLabel(value) {
  const preset = GENDER_OPTIONS.find((o) => o.value === value);
  return preset ? preset.label : value;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function ProfilePage({ token, onUserUpdate }) {
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selfDescribe, setSelfDescribe] = useState(false);

  const [goalValue, setGoalValue] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState('');
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    getProfile(token)
      .then(({ user }) => {
        const next = formToState(user);
        setForm(next);
        setSavedForm(next);
        setSelfDescribe(!GENDER_PRESETS.includes(next.gender));
        setEditingInfo(!isProfileFilledOut(next));
        setGoalValue(user.reading_goal && user.reading_goal_year === CURRENT_YEAR ? String(user.reading_goal) : '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleGenderSelect(value) {
    if (value === 'self-describe') {
      setSelfDescribe(true);
      handleChange('gender', '');
    } else {
      setSelfDescribe(false);
      handleChange('gender', value);
    }
  }

  function handleEdit() {
    setError('');
    setSaved(false);
    setEditingInfo(true);
  }

  function handleCancel() {
    setForm(savedForm);
    setSelfDescribe(!GENDER_PRESETS.includes(savedForm.gender));
    setError('');
    setEditingInfo(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const { user } = await updateProfile(token, form);
      const next = formToState(user);
      setForm(next);
      setSavedForm(next);
      setSelfDescribe(!GENDER_PRESETS.includes(next.gender));
      onUserUpdate(user);
      setSaved(true);
      setEditingInfo(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGoalSubmit(e) {
    e.preventDefault();
    const goal = parseInt(goalValue, 10);
    if (!Number.isInteger(goal) || goal < 1) {
      setGoalError('Enter a whole number of at least 1');
      return;
    }
    setGoalSaving(true);
    setGoalError('');
    setGoalSaved(false);
    try {
      const { user } = await updateProfile(token, { reading_goal: goal, reading_goal_year: CURRENT_YEAR });
      onUserUpdate(user);
      setGoalSaved(true);
    } catch (err) {
      setGoalError(err.message);
    } finally {
      setGoalSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSaved(false);
    try {
      await changePassword(token, passwords.current, passwords.next);
      setPasswords({ current: '', next: '' });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="profile-page">
        <h1>Profile</h1>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <p className="profile-sub">Update the details tied to your account.</p>

      <div className="profile-card">
        <h2>Theme</h2>
        <ThemeBar inline />
      </div>

      {editingInfo ? (
        <form className="profile-card" onSubmit={handleSubmit}>
          <h2>Personal information</h2>

          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Jamie Reyes"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="dob-month">Date of birth</label>
              <DateFields
                idPrefix="dob"
                value={form.date_of_birth}
                onChange={(value) => handleChange('date_of_birth', value)}
                minYear={1900}
                maxYear={CURRENT_YEAR}
              />
            </div>

            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={selfDescribe ? 'self-describe' : form.gender}
                onChange={(e) => handleGenderSelect(e.target.value)}
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {selfDescribe && (
            <div className="field">
              <label htmlFor="gender-self-describe">Self-described gender</label>
              <input
                id="gender-self-describe"
                type="text"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                placeholder="How would you describe it?"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Canada"
            />
          </div>

          {error && <p className="profile-error" role="alert">{error}</p>}

          <div className="profile-form-actions">
            <button className="profile-submit" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {isProfileFilledOut(savedForm) && (
              <button type="button" className="profile-cancel" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="profile-card">
          <div className="profile-card-head">
            <h2>Personal information</h2>
            <button type="button" className="profile-edit" onClick={handleEdit}>
              Edit personal information
            </button>
          </div>

          {saved && <p className="profile-success">Profile updated.</p>}

          <dl className="profile-info-list">
            <div>
              <dt>Name</dt>
              <dd>{form.name || <span className="profile-info-empty">Not set</span>}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{form.email}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{formatDate(form.date_of_birth) || <span className="profile-info-empty">Not set</span>}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd>{genderLabel(form.gender)}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{form.country || <span className="profile-info-empty">Not set</span>}</dd>
            </div>
          </dl>
        </div>
      )}

      <form className="profile-card" onSubmit={handleGoalSubmit}>
        <h2>{CURRENT_YEAR} Reading Goal</h2>
        <div className="field">
          <label htmlFor="reading-goal">Books to read this year</label>
          <input
            id="reading-goal"
            type="number"
            min="1"
            value={goalValue}
            onChange={(e) => { setGoalValue(e.target.value); setGoalSaved(false); }}
            placeholder="20"
          />
        </div>

        {goalError && <p className="profile-error" role="alert">{goalError}</p>}
        {goalSaved && <p className="profile-success">Reading goal updated.</p>}

        <button className="profile-submit" type="submit" disabled={goalSaving}>
          {goalSaving ? 'Saving…' : 'Save goal'}
        </button>
      </form>

      <form className="profile-card" onSubmit={handlePasswordSubmit}>
        <h2>Change password</h2>
        <div className="field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            value={passwords.current}
            onChange={(e) => { setPasswords((p) => ({ ...p, current: e.target.value })); setPasswordSaved(false); }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            value={passwords.next}
            onChange={(e) => { setPasswords((p) => ({ ...p, next: e.target.value })); setPasswordSaved(false); }}
            minLength={8}
            placeholder="At least 8 characters"
            required
          />
        </div>

        {passwordError && <p className="profile-error" role="alert">{passwordError}</p>}
        {passwordSaved && <p className="profile-success">Password changed.</p>}

        <button className="profile-submit" type="submit" disabled={changingPassword}>
          {changingPassword ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
