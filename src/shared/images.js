export function imageKeyFor(tweetId, mediaIndex) {
  return `${tweetId}:${mediaIndex}`;
}

export function parseImageKey(key) {
  const idx = key.lastIndexOf(':');
  return {
    tweetId: key.slice(0, idx),
    mediaIndex: Number(key.slice(idx + 1)),
  };
}

function toRecord(tweet, mediaIndex) {
  return {
    imageKey: imageKeyFor(tweet.id, mediaIndex),
    tweetId: tweet.id,
    mediaIndex,
    url: tweet.mediaUrls[mediaIndex],
    authorHandle: tweet.authorHandle,
    authorName: tweet.authorName,
    tweetUrl: tweet.tweetUrl,
  };
}

export function flattenImages(tweets) {
  const out = [];
  for (const tweet of tweets) {
    const urls = tweet.mediaUrls ?? [];
    for (let i = 0; i < urls.length; i += 1) {
      out.push(toRecord(tweet, i));
    }
  }
  return out;
}

export function imagesForCollection(collection, tweetsById) {
  const out = [];
  for (const key of collection.imageKeys ?? []) {
    const { tweetId, mediaIndex } = parseImageKey(key);
    const tweet = tweetsById.get(tweetId);
    if (!tweet || !tweet.mediaUrls || tweet.mediaUrls[mediaIndex] == null)
      continue;
    out.push(toRecord(tweet, mediaIndex));
  }
  return out;
}
