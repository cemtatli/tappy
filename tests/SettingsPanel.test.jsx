import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../src/shared/xSettings.js', () => ({
  loadXSettings: vi.fn(() => Promise.resolve({})),
  saveXSettings: vi.fn(() => Promise.resolve()),
}));
vi.mock('../src/shared/messages.js', () => ({
  requestXStatus: vi.fn(() =>
    Promise.resolve({ ok: true, data: { isLoggedIn: true } })
  ),
  requestDiscoverXConfig: vi.fn(() => Promise.resolve({ ok: true })),
}));

import { SettingsPanel } from '../src/page/components/SettingsPanel.jsx';
import { loadXSettings, saveXSettings } from '../src/shared/xSettings.js';
import { requestXStatus } from '../src/shared/messages.js';
import { featureLabel } from '../src/page/lib/featureLabels.js';

const FULL_CONFIG = {
  bearerToken: 'AAAA',
  bookmarksQueryId: 'qid',
  deleteBookmarkQueryId: 'did',
};

function loggedIn(isLoggedIn) {
  requestXStatus.mockResolvedValue({ ok: true, data: { isLoggedIn } });
}

beforeEach(() => {
  vi.clearAllMocks();
  loadXSettings.mockResolvedValue({});
  saveXSettings.mockResolvedValue();
  loggedIn(true);
});

describe('SettingsPanel connection card', () => {
  it('reports a healthy connection when logged in with every value captured', async () => {
    loadXSettings.mockResolvedValue(FULL_CONFIG);
    render(<SettingsPanel open onClose={() => {}} />);
    expect(await screen.findByText(/bağlı/i)).toBeTruthy();
  });

  it('hides the API fields while the connection is healthy', async () => {
    loadXSettings.mockResolvedValue(FULL_CONFIG);
    render(<SettingsPanel open onClose={() => {}} />);
    await screen.findByText(/bağlı/i);
    expect(screen.queryByLabelText('Bearer token')).toBeNull();
  });

  it('reveals the API fields when the advanced section is opened', async () => {
    loadXSettings.mockResolvedValue(FULL_CONFIG);
    render(<SettingsPanel open onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /gelişmiş/i }));
    expect(screen.getByLabelText('Bearer token')).toBeTruthy();
  });

  it('opens the advanced section on its own when values are missing', async () => {
    loadXSettings.mockResolvedValue({ bearerToken: 'AAAA' });
    render(<SettingsPanel open onClose={() => {}} />);
    expect(await screen.findByLabelText('Bearer token')).toBeTruthy();
  });

  it('reports how many values were captured when the setup is unfinished', async () => {
    loadXSettings.mockResolvedValue({ bearerToken: 'AAAA' });
    render(<SettingsPanel open onClose={() => {}} />);
    expect(await screen.findByText(/1\s*\/\s*3/)).toBeTruthy();
  });

  it('asks the user to sign in when there is no x.com session', async () => {
    loggedIn(false);
    loadXSettings.mockResolvedValue(FULL_CONFIG);
    render(<SettingsPanel open onClose={() => {}} />);
    expect(await screen.findByRole('button', { name: /x\.com/i })).toBeTruthy();
  });
});

describe('SettingsPanel', () => {
  it('saves trimmed field values', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    fireEvent.change(await screen.findByLabelText('Bearer token'), {
      target: { value: '  TOK  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /kaydet/i }));
    await waitFor(() => expect(saveXSettings).toHaveBeenCalled());
    expect(saveXSettings.mock.calls[0][0].bearerToken).toBe('TOK');
  });

  it('keeps the feature list collapsed until it is opened', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    await screen.findByLabelText('Bearer token');
    expect(
      screen.queryByText(featureLabel('rweb_video_screen_enabled'))
    ).toBeNull();
  });

  it('toggling a feature checkbox then Kaydet calls saveXSettings with a bookmarksFeatures object', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    fireEvent.click(
      await screen.findByRole('button', { name: /bookmarks features/i })
    );
    const checkbox = screen
      .getByText(featureLabel('rweb_video_screen_enabled'))
      .closest('label')
      .querySelector('[role="checkbox"]');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /kaydet/i }));
    await waitFor(() => expect(saveXSettings).toHaveBeenCalled());
    const { bookmarksFeatures } = saveXSettings.mock.calls[0][0];
    expect(typeof bookmarksFeatures).toBe('object');
    expect(bookmarksFeatures).not.toBeNull();
  });

  it('no longer offers the Figma stub', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    await screen.findByLabelText('Bearer token');
    expect(screen.queryByText(/figma/i)).toBeNull();
  });
});
