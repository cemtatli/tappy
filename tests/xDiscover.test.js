import { describe, it, expect } from 'vitest';
import {
  parseXConfig,
  extractScriptUrls,
  mergeDiscovered,
  chunkPriority,
  discoverXConfig,
} from '../src/background/xDiscover.js';

describe('parseXConfig', () => {
  it('extracts the public bearer token', () => {
    const js = `var t="AAAAAAAAAAAAAAAAAAAAA${'B'.repeat(80)}%3D%3Dabc";`;
    const out = parseXConfig(js);
    expect(out.bearerToken).toBe(
      `AAAAAAAAAAAAAAAAAAAAA${'B'.repeat(80)}%3D%3Dabc`
    );
  });

  it('extracts bookmarks queryId when queryId precedes operationName', () => {
    const js = `x={queryId:"aBcD1234_efGH5678ijKL",operationName:"Bookmarks",operationType:"query"}`;
    expect(parseXConfig(js).bookmarksQueryId).toBe('aBcD1234_efGH5678ijKL');
  });

  it('extracts bookmarks queryId when operationName precedes queryId', () => {
    const js = `x={operationName:"Bookmarks",operationType:"query",queryId:"ZZ11yy22XX33ww44VV55"}`;
    expect(parseXConfig(js).bookmarksQueryId).toBe('ZZ11yy22XX33ww44VV55');
  });

  it('extracts delete bookmark queryId', () => {
    const js = `a={queryId:"del_Query_Id_000111",operationName:"DeleteBookmark"}`;
    expect(parseXConfig(js).deleteBookmarkQueryId).toBe('del_Query_Id_000111');
  });

  it('does not cross object boundaries', () => {
    // queryId belongs to a different operation object than Bookmarks
    const js = `a={queryId:"WRONG_other_id_000"},b={operationName:"Bookmarks"}`;
    expect(parseXConfig(js).bookmarksQueryId).toBeNull();
  });

  it('returns nulls when nothing matches', () => {
    const out = parseXConfig('const x = 1;');
    expect(out).toEqual({
      bearerToken: null,
      bookmarksQueryId: null,
      deleteBookmarkQueryId: null,
    });
  });
});

describe('extractScriptUrls', () => {
  it('finds abs.twimg client-web js urls in html', () => {
    const html = `<script src="https://abs.twimg.com/responsive-web/client-web/main.abc123.js"></script>
      <link href="https://abs.twimg.com/responsive-web/client-web/api.def456.js">`;
    expect(extractScriptUrls(html)).toEqual([
      'https://abs.twimg.com/responsive-web/client-web/main.abc123.js',
      'https://abs.twimg.com/responsive-web/client-web/api.def456.js',
    ]);
  });

  it('dedupes repeated urls', () => {
    const u = 'https://abs.twimg.com/responsive-web/client-web/x.1.js';
    expect(extractScriptUrls(`${u} ${u}`)).toEqual([u]);
  });

  it('ignores non-client-web urls', () => {
    expect(extractScriptUrls('https://abs.twimg.com/other/foo.js')).toEqual([]);
  });
});

describe('mergeDiscovered', () => {
  it('keeps only non-null discovered fields', () => {
    const patch = mergeDiscovered({
      bearerToken: 'tok',
      bookmarksQueryId: null,
      deleteBookmarkQueryId: 'del',
    });
    expect(patch).toEqual({ bearerToken: 'tok', deleteBookmarkQueryId: 'del' });
  });

  it('returns empty object when all null', () => {
    expect(
      mergeDiscovered({
        bearerToken: null,
        bookmarksQueryId: null,
        deleteBookmarkQueryId: null,
      })
    ).toEqual({});
  });
});

describe('chunkPriority', () => {
  const base = 'https://abs.twimg.com/responsive-web/client-web/';

  it('ranks the Bookmarks bundle first', () => {
    expect(chunkPriority(`${base}bundle.Bookmarks.abc.js`)).toBe(0);
  });

  it('ranks main/shared/vendor bundles ahead of the rest', () => {
    expect(chunkPriority(`${base}main.abc.js`)).toBe(1);
    expect(chunkPriority(`${base}shared~abc.js`)).toBe(1);
    expect(chunkPriority(`${base}i18n.abc.js`)).toBe(2);
  });
});

describe('discoverXConfig ordering', () => {
  const base = 'https://abs.twimg.com/responsive-web/client-web/';
  const BEARER = `AAAAAAAAAAAAAAAAAAAAA${'B'.repeat(60)}`;

  // HTML her chunk'ı listeler ama aradığımız değerler yalnızca ikisinde.
  // Öncelik sıralaması olmasaydı keşif, gürültü chunk'larını da indirirdi.
  function makeFetch(fetched) {
    const bodies = {
      'https://x.com/i/bookmarks': [
        `${base}i18n.1.js`,
        `${base}ondemand.2.js`,
        `${base}bundle.Bookmarks.3.js`,
        `${base}main.4.js`,
      ]
        .map((u) => `<script src="${u}"></script>`)
        .join(''),
      // Gerçek bundle'daki gibi ayrı obje literalleri: findQueryId'nin `[^}]`
      // sınırı iki sorguyu birbirine karıştırmasın.
      [`${base}bundle.Bookmarks.3.js`]:
        '{operationName:"Bookmarks",queryId:"QQQQQQQQQQQQQQQQ"},' +
        '{operationName:"DeleteBookmark",queryId:"DDDDDDDDDDDDDDDD"}',
      [`${base}main.4.js`]: `var t="${BEARER}";`,
    };
    return async (url) => {
      fetched.push(url);
      return { ok: true, text: async () => bodies[url] ?? '' };
    };
  }

  it('finds everything without touching low-priority chunks', async () => {
    const fetched = [];
    const acc = await discoverXConfig({ fetchFn: makeFetch(fetched) });

    expect(acc.bookmarksQueryId).toBe('QQQQQQQQQQQQQQQQ');
    expect(acc.deleteBookmarkQueryId).toBe('DDDDDDDDDDDDDDDD');
    expect(acc.bearerToken).toBe(BEARER);

    // HTML + Bookmarks bundle + main bundle. i18n/ondemand hiç indirilmedi.
    expect(fetched).toEqual([
      'https://x.com/i/bookmarks',
      `${base}bundle.Bookmarks.3.js`,
      `${base}main.4.js`,
    ]);
  });
});
