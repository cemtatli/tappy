const KEY = 'x-bookmarker:prefs';

const DEFAULTS = { sortMode: 'date-desc', viewMode: 'grid', source: 'all' };

const VALID = {
  sortMode: ['date-desc', 'date-asc', 'likes-desc'],
  viewMode: ['grid', 'canvas'],
};

export function loadPrefs() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    stored = {};
  }
  const prefs = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (key in VALID) {
      if (VALID[key].includes(stored[key])) prefs[key] = stored[key];
    } else if (stored[key] !== undefined) {
      prefs[key] = stored[key];
    }
  }
  return prefs;
}

export function savePrefs(patch) {
  const next = { ...loadPrefs(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
}
