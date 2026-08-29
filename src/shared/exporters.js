function csvEscape(value) {
  let str = String(value ?? '');
  // Formül başlangıç karakterleri (=, +, -, @, tab, CR) Excel/LibreOffice'te
  // çalıştırılır; tweet metni saldırgan kontrolünde olduğu için nötrleştir.
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toJson(tweets) {
  return JSON.stringify(tweets, null, 2);
}

const CSV_COLUMNS = [
  'id',
  'authorHandle',
  'authorName',
  'text',
  'createdAt',
  'mediaUrls',
  'tweetUrl',
];

export function toCsv(tweets) {
  const header = CSV_COLUMNS.join(',');
  const rows = tweets.map((t) =>
    CSV_COLUMNS.map((col) => {
      const value = col === 'mediaUrls' ? t.mediaUrls.join(';') : t[col];
      return csvEscape(value);
    }).join(',')
  );
  return [header, ...rows].join('\n');
}
