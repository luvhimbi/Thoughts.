import React from 'react';
import { MOODS } from '../../components/MoodSelector';

const JournalList = ({ 
  entries, 
  fetchingEntries, 
  displayLimit, 
  setDisplayLimit, 
  searchQuery, 
  setSearchQuery, 
  onViewEntry, 
  onInitiateRelease,
  releasingEntryId,
  onCancelRelease,
  onConfirmRelease,
  isCompact,
  formatListDate,
  getEntryPreview,
  isOnlyEmojis,
  extractFirstImage
}) => {

  if (entries.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-4" style={{ fontSize: '3rem', opacity: 0.5 }}>◌</div>
        {searchQuery ? (
          <>
            <h2 className="h4 mb-2" style={{ fontWeight: 400 }}>No thoughts found.</h2>
            <p className="text-secondary px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
              Try searching for something else or clear your search to see all entries.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="btn btn-link text-dark mt-3 text-decoration-none small fw-500"
            >
              Clear search
            </button>
          </>
        ) : (
          <>
            <h2 className="h4 mb-2" style={{ fontWeight: 400 }}>A quiet space for you.</h2>
            <p className="text-secondary px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
              There is no right or wrong way to write. I'm here whenever you're ready to share.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="entries-list">
      {entries.slice(0, displayLimit).map(entry => {
        const preview = getEntryPreview(entry.content);
        const isEmojiOnly = isOnlyEmojis(entry.content);
        return (
          <div
            key={entry.id}
            className={`list-entry animate-fade-in ${isCompact ? 'compact' : ''}`}
            onClick={() => onViewEntry(entry.id)}
          >
            <div className="list-entry-date">
              <span className="list-day">{formatListDate(entry.dateString).day}</span>
              <span className="list-number">{formatListDate(entry.dateString).number}</span>
              {!entry.createdAt && (
                <div className="list-sync-pending mt-1" title="Syncing...">
                  <span className="sync-dot sync-offline"></span>
                </div>
              )}
            </div>

            <div className="list-entry-content">
              {isEmojiOnly ? (
                <div className="timeline-emoji-only animate-fade-in">{entry.content.replace(/<[^>]*>/g, '').trim()}</div>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h2 className="list-entry-title m-0">{preview.title}</h2>
                    {entry.mood && (
                      <div
                        className="mood-indicator-dot"
                        style={{ backgroundColor: MOODS.find(m => m.id === entry.mood)?.color }}
                        title={MOODS.find(m => m.id === entry.mood)?.label}
                      ></div>
                    )}
                  </div>
                  <p className="list-entry-body m-0">{preview.body}</p>
                </>
              )}
            </div>

            {extractFirstImage(entry.content) && (
              <div className="list-entry-image">
                <img src={extractFirstImage(entry.content)} alt="Entry thumbnail" />
              </div>
            )}

            <button
              className="list-release-btn"
              onClick={(e) => onInitiateRelease(entry.id, e)}
              title="Release this thought"
            >
              ×
            </button>

            {releasingEntryId === entry.id && (
              <div className="confirm-release-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 text-center">
                <p className="small mb-3 fw-500">Release this thought forever?</p>
                <div className="d-flex gap-3">
                  <button
                    className="btn btn-sm btn-link text-dark text-decoration-none"
                    onClick={(e) => onCancelRelease(e)}
                  >
                    Keep it
                  </button>
                  <button
                    className="btn btn-sm btn-dark rounded-pill px-3"
                    onClick={(e) => onConfirmRelease(entry.id, e)}
                  >
                    Release
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {entries.length > displayLimit && (
        <div className="text-center mt-4 mb-4">
          <button
            className="btn btn-outline-dark rounded-pill px-4 py-2 fw-500"
            onClick={() => setDisplayLimit(prev => prev + 15)}
          >
            Load More Thoughts
          </button>
        </div>
      )}
    </div>
  );
};

export default JournalList;
