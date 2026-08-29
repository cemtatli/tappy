import { describe, it, expect } from 'vitest';
import { toJson, toCsv } from '../src/shared/exporters.js';

const sample = [
  {
    id: '1',
    sortIndex: '100',
    authorHandle: 'foo',
    authorName: 'Foo Bar',
    text: 'hello, "world"',
    createdAt: '2026-07-02T12:00:00.000Z',
    mediaUrls: ['https://a.com/1.jpg', 'https://a.com/2.jpg'],
    tweetUrl: 'https://x.com/foo/status/1',
    cachedAt: '2026-07-02T12:30:00.000Z',
  },
];

describe('toJson', () => {
  it('round-trips the tweet array', () => {
    expect(JSON.parse(toJson(sample))).toEqual(sample);
  });
});

describe('toCsv', () => {
  it('writes header row with expected columns', () => {
    const csv = toCsv(sample);
    const [header] = csv.split('\n');
    expect(header).toBe(
      'id,authorHandle,authorName,text,createdAt,mediaUrls,tweetUrl'
    );
  });

  it('escapes commas and quotes, joins mediaUrls with ;', () => {
    const csv = toCsv(sample);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('"hello, ""world"""');
    expect(dataLine).toContain('https://a.com/1.jpg;https://a.com/2.jpg');
  });

  it('neutralises spreadsheet formula prefixes in text fields', () => {
    const csv = toCsv([
      {
        ...sample[0],
        text: '=HYPERLINK("https://evil.tld")',
        authorName: '+1',
      },
    ]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain(`"'=HYPERLINK(""https://evil.tld"")"`);
    expect(dataLine).toContain(",'+1,");
  });
});
