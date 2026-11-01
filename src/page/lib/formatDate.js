const dayFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dayTimeFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDay(iso) {
  return iso ? dayFormat.format(new Date(iso)) : '';
}

export function formatDayTime(iso) {
  return iso ? dayTimeFormat.format(new Date(iso)) : '';
}
