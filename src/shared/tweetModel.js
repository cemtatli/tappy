function parseTweetResult(result) {
  if (!result) return null;
  const tweet =
    result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
  if (!tweet || tweet.__typename !== 'Tweet') return null;

  const legacy = tweet.legacy;
  if (!legacy) return null;

  const userResult = tweet.core?.user_results?.result;
  if (!userResult) return null;

  const userCore = userResult.core;
  const userLegacy = userResult.legacy;
  const authorHandle = userCore?.screen_name ?? userLegacy?.screen_name;
  if (!authorHandle) return null;

  const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
  const text = noteText ?? legacy.full_text ?? '';

  const mediaSource =
    legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
  const mediaUrls = mediaSource.map((m) => m.media_url_https).filter(Boolean);

  const id = tweet.rest_id;
  const avatarUrl =
    userResult.avatar?.image_url ??
    userCore?.avatar?.image_url ??
    userLegacy?.profile_image_url_https ??
    null;

  return {
    id,
    authorHandle,
    authorName: userCore?.name ?? userLegacy?.name ?? authorHandle,
    text,
    createdAt: new Date(legacy.created_at).toISOString(),
    mediaUrls,
    tweetUrl: `https://x.com/${authorHandle}/status/${id}`,
    avatarUrl,
    stats: {
      likes: legacy.favorite_count ?? 0,
      retweets: legacy.retweet_count ?? 0,
      replies: legacy.reply_count ?? 0,
    },
  };
}

export function parseBookmarksResponse(json, fetchedAtIso) {
  const instructions =
    json?.data?.bookmark_timeline_v2?.timeline?.instructions ?? [];
  const addEntries = instructions.find((i) => i.type === 'TimelineAddEntries');
  const entries = addEntries?.entries ?? [];

  const tweets = [];
  let nextCursor = null;

  for (const entry of entries) {
    const content = entry.content;
    if (!content) continue;

    if (
      content.entryType === 'TimelineTimelineCursor' &&
      content.cursorType === 'Bottom'
    ) {
      nextCursor = content.value ?? null;
      continue;
    }

    if (
      content.entryType !== 'TimelineTimelineItem' ||
      content.itemContent?.itemType !== 'TimelineTweet'
    ) {
      continue;
    }

    const result = content.itemContent.tweet_results?.result;
    if (!result || result.__typename !== 'Tweet') continue;

    const parsed = parseTweetResult(result);
    if (!parsed) continue;

    const quotedParsed = parseTweetResult(result.quoted_status_result?.result);
    const quoted = quotedParsed
      ? {
          authorName: quotedParsed.authorName,
          authorHandle: quotedParsed.authorHandle,
          avatarUrl: quotedParsed.avatarUrl,
          text: quotedParsed.text,
          mediaUrls: quotedParsed.mediaUrls,
          tweetUrl: quotedParsed.tweetUrl,
          createdAt: quotedParsed.createdAt,
        }
      : null;

    tweets.push({
      ...parsed,
      sortIndex: entry.sortIndex ?? '0',
      cachedAt: fetchedAtIso,
      quoted,
    });
  }

  return { tweets, nextCursor };
}
