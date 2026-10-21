import {
  addDays,
  addMonths,
  cellLabel,
  clampDate,
  formatLongDate,
  formatMonth,
  isSunday,
  monthGrid,
  monthOf,
  moveDate,
  reasonText,
} from './calendar';

describe('calendar date maths', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });

  it('is not shifted by the clock change on 25 October', () => {
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });

  it('adds months, keeping the day or using the last day of a shorter month', () => {
    expect(addMonths('2026-11-12', 1)).toBe('2026-12-12');
    expect(addMonths('2026-12-12', 1)).toBe('2027-01-12');
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2026-12-31', -1)).toBe('2026-11-30');
  });

  it('clamps a date into a range', () => {
    expect(clampDate('2026-10-30', '2026-11-01', '2026-12-31')).toBe('2026-11-01');
    expect(clampDate('2027-01-02', '2026-11-01', '2026-12-31')).toBe('2026-12-31');
    expect(clampDate('2026-11-15', '2026-11-01', '2026-12-31')).toBe('2026-11-15');
  });

  it('gives the month of a date', () => {
    expect(monthOf('2026-11-12')).toBe('2026-11');
  });

  it('knows Sundays', () => {
    expect(isSunday('2026-11-15')).toBe(true);
    expect(isSunday('2026-11-14')).toBe(false);
  });
});

describe('monthGrid', () => {
  it('lays a month out in Monday-first weeks, padding with nulls', () => {
    // 1 November 2026 is a Sunday; 30 November is a Monday.
    const weeks = monthGrid('2026-11');

    expect(weeks.length).toBe(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks[1][0]).toBe('2026-11-02');
    expect(weeks[5]).toEqual(['2026-11-30', null, null, null, null, null, null]);
  });

  it('has no empty weeks when a month starts on a Monday', () => {
    // 1 March 2027 is a Monday.
    expect(monthGrid('2027-03')[0][0]).toBe('2027-03-01');
  });
});

describe('moveDate (keyboard movement)', () => {
  // Thursday 12 November 2026.
  const day = '2026-11-12';

  it.each([
    ['ArrowLeft', '2026-11-11'],
    ['ArrowRight', '2026-11-13'],
    ['ArrowUp', '2026-11-05'],
    ['ArrowDown', '2026-11-19'],
    ['PageUp', '2026-10-12'],
    ['PageDown', '2026-12-12'],
    ['Home', '2026-11-09'],
    ['End', '2026-11-15'],
  ])('%s moves to %s', (key, expected) => {
    expect(moveDate(day, key)).toBe(expected);
  });

  it('treats Monday as the start of the week and Sunday as the end', () => {
    expect(moveDate('2026-11-09', 'Home')).toBe('2026-11-09');
    expect(moveDate('2026-11-15', 'End')).toBe('2026-11-15');
    expect(moveDate('2026-11-15', 'Home')).toBe('2026-11-09');
  });

  it('returns null for keys that do not move', () => {
    expect(moveDate(day, 'a')).toBeNull();
    expect(moveDate(day, 'Enter')).toBeNull();
  });
});

describe('labels', () => {
  it('formats dates and months in British English', () => {
    expect(formatLongDate('2026-11-12')).toBe('Thursday 12 November');
    expect(formatMonth('2026-11')).toBe('November 2026');
  });

  it('describes every reason a date is unavailable', () => {
    expect(reasonText('past')).toBe('in the past');
    expect(reasonText('after_cutoff')).toBe('too late to order, orders for tomorrow close at 2pm');
    expect(reasonText('closed')).toBe("we don't deliver that day");
    expect(reasonText('fully_booked')).toBe('fully booked');
    expect(reasonText('lead_time')).toBe('too soon, this gift is made to order');
    expect(reasonText('out_of_stock')).toBe('out of stock');
    expect(reasonText('too_far')).toBe('too far ahead to book');
  });

  it('names a cell with its date, and its reason when unavailable', () => {
    expect(cellLabel('2026-11-12', null)).toBe('Thursday 12 November');
    expect(cellLabel('2026-11-14', 'fully_booked')).toBe('Saturday 14 November, fully booked');
  });
});
