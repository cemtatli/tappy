import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronsUp, ChevronsDown } from 'lucide-react';
import { Card } from './Card.jsx';
import { cn } from '../lib/cn.js';

const ESTIMATE_SIZE = 180;
const LOAD_MORE_THRESHOLD = 5;

export function CardGrid({
  tweets,
  selectionMode,
  selectedIds,
  exitingIds,
  onToggleSelect,
  onExportOne,
  onUnmarkOne,
  onPreview,
  onStatus,
  onLoadMore,
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: tweets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: 5,
    // jsdom measures every element as 0px tall; a seed rect keeps tests able to
    // render rows. ResizeObserver corrects this immediately in a real browser.
    initialRect: { width: 800, height: 800 },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVisibleIndex =
    virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].index : -1;

  useEffect(() => {
    if (tweets.length === 0) return;
    if (lastVisibleIndex >= tweets.length - LOAD_MORE_THRESHOLD) {
      onLoadMore?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisibleIndex, tweets.length]);

  function scrollToTop() {
    rowVirtualizer.scrollToIndex(0, { align: 'start' });
  }

  function scrollToBottom() {
    rowVirtualizer.scrollToIndex(tweets.length - 1, { align: 'end' });
  }

  const jumpButtonClass =
    'rounded-full border border-line bg-white/70 p-2.5 text-text backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors hover:bg-white hover:text-text';

  return (
    <div className="relative w-full max-w-[600px]">
      <div
        ref={parentRef}
        data-testid="card-container"
        className="h-screen w-full max-w-[600px] overflow-auto border-x border-line"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const tweet = tweets[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  'border-b border-line',
                  exitingIds?.has(tweet.id) && 'card-exit'
                )}
              >
                <Card
                  tweet={tweet}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(tweet.id)}
                  onToggleSelect={onToggleSelect}
                  onExportOne={onExportOne}
                  onUnmarkOne={onUnmarkOne}
                  onPreview={onPreview}
                  onStatus={onStatus}
                />
              </div>
            );
          })}
        </div>
      </div>
      {tweets.length > 0 && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            type="button"
            aria-label="En üste git"
            onClick={scrollToTop}
            className={jumpButtonClass}
          >
            <ChevronsUp size={18} />
          </button>
          <button
            type="button"
            aria-label="En alta git"
            onClick={scrollToBottom}
            className={jumpButtonClass}
          >
            <ChevronsDown size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
