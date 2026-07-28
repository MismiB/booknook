import { useEffect, useState } from 'react';
import './DateFields.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function parseValue(value) {
  if (!value) return { year: '', month: '', day: '' };
  const [y, m, d] = value.slice(0, 10).split('-');
  return { year: y || '', month: m ? String(Number(m)) : '', day: d ? String(Number(d)) : '' };
}

export default function DateFields({ value, onChange, minYear = 1900, maxYear = new Date().getFullYear(), idPrefix = 'date', compact = false }) {
  const [parts, setParts] = useState(parseValue(value));

  useEffect(() => {
    setParts(parseValue(value));
  }, [value]);

  function commit(next) {
    setParts(next);
    const year = parseInt(next.year, 10);
    const month = parseInt(next.month, 10);
    const day = parseInt(next.day, 10);

    if (
      next.year.length === 4 &&
      Number.isInteger(year) && year >= minYear && year <= maxYear &&
      Number.isInteger(month) && month >= 1 && month <= 12 &&
      Number.isInteger(day) && day >= 1 && day <= daysInMonth(year, month)
    ) {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      onChange(`${year}-${mm}-${dd}`);
    }
  }

  function handleYear(e) {
    const year = e.target.value.replace(/\D/g, '').slice(0, 4);
    commit({ ...parts, year });
  }

  function handleMonthSelect(e) {
    commit({ ...parts, month: e.target.value });
  }

  function handleMonthNumeric(e) {
    const month = e.target.value.replace(/\D/g, '').slice(0, 2);
    commit({ ...parts, month });
  }

  function handleDay(e) {
    const day = e.target.value.replace(/\D/g, '').slice(0, 2);
    commit({ ...parts, day });
  }

  function selectOnFocus(e) {
    e.target.select();
  }

  return (
    <div className="date-fields-group">
      <div className={compact ? 'date-fields date-fields--compact' : 'date-fields'}>
        {compact ? (
          <input
            id={`${idPrefix}-month`}
            className="date-field-month date-field-month--numeric"
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            value={parts.month}
            onChange={handleMonthNumeric}
            onFocus={selectOnFocus}
            aria-label="Month"
          />
        ) : (
          <select
            id={`${idPrefix}-month`}
            className="date-field-month"
            value={parts.month}
            onChange={handleMonthSelect}
            aria-label="Month"
          >
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        )}
        <input
          id={`${idPrefix}-day`}
          className="date-field-day"
          type="text"
          inputMode="numeric"
          placeholder="DD"
          maxLength={2}
          value={parts.day}
          onChange={handleDay}
          onFocus={selectOnFocus}
          aria-label="Day"
        />
        <input
          id={`${idPrefix}-year`}
          className="date-field-year"
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          maxLength={4}
          value={parts.year}
          onChange={handleYear}
          onFocus={selectOnFocus}
          aria-label="Year"
        />
      </div>
      <div className={compact ? 'date-fields-caption date-fields-caption--compact' : 'date-fields-caption'}>
        <span className="date-field-month">MM</span>
        <span className="date-field-day">DD</span>
        <span className="date-field-year">YYYY</span>
      </div>
    </div>
  );
}
