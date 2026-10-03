# Install Tappy

Tappy is a Chromium extension distributed through GitHub, not the Chrome Web Store.

1. Download the `tappy-<version>-chrome.zip` asset from https://github.com/cemtatli/tappy/releases/latest (not GitHub's source-code ZIP).
2. Extract it into a permanent folder. Keep `manifest.json` directly inside that folder.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Sign in to X in the same browser profile. Click the Tappy extension icon to open it.

The interface is currently in Turkish. Tappy reads your own bookmarks using your X session and stores them locally. No Tappy server receives your bookmarks. The extension needs cookie access to authenticate with X, storage for connection settings, and webRequest access to discover X API configuration from your own traffic. X API changes can interrupt sync; open x.com and check Tappy's connection settings if needed.

## Upgrade

There are no automatic updates. Download the newer ZIP, close Tappy tabs, and extract the new files into the **same installation folder**, replacing the previous extension files. Then click **Reload** on Tappy's card in `chrome://extensions` and reopen it. Do not remove the extension first or clear its storage if you want to keep local collections and bookmarks. Export important data as JSON before upgrading.

## Verify the download

Download `SHA256SUMS.txt` next to the ZIP. On macOS or Linux, run:

```sh
shasum -a 256 -c SHA256SUMS.txt
```

For Windows, `Get-FileHash .\tappy-<version>-chrome.zip -Algorithm SHA256` prints a digest you can compare with the checksum file.

Source and license: https://github.com/cemtatli/tappy — MIT.
