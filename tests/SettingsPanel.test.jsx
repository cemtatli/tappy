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
}));

import { SettingsPanel } from '../src/page/components/SettingsPanel.jsx';
import { saveXSettings } from '../src/shared/xSettings.js';
import { featureLabel } from '../src/page/lib/featureLabels.js';

beforeEach(() => vi.clearAllMocks());

describe('SettingsPanel', () => {
  it('saves trimmed field values', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Bearer token'), {
      target: { value: '  TOK  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /kaydet/i }));
    await waitFor(() => expect(saveXSettings).toHaveBeenCalled());
    expect(saveXSettings.mock.calls[0][0].bearerToken).toBe('TOK');
  });

  it('shows X login status', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    expect(await screen.findByText(/giriş yapılı/i)).toBeTruthy();
  });

  it('toggling a feature checkbox then Kaydet calls saveXSettings with a bookmarksFeatures object', async () => {
    render(<SettingsPanel open onClose={() => {}} />);
    // wait for settings to load
    await waitFor(() =>
      expect(
        screen.getByText(featureLabel('rweb_video_screen_enabled'))
      ).toBeTruthy()
    );
    // click the checkbox for rweb_video_screen_enabled
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
});
