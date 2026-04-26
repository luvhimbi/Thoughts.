import React from 'react';
import { MOODS } from '../../components/MoodSelector';

const JournalViewing = ({
  entry,
  isSpeaking,
  speakingIndex,
  segments,
  isOnlyEmojis
}) => {
  const currentMoodData = MOODS.find(m => m.id === entry.mood);

  return (
    <div className="view-content-wrapper">
      <article className={`entry-display entry-design-${entry.design || 'minimal'}`}>
        {isSpeaking ? (
          <div className="speaking-container">
            {segments.map((text, i) => (
              <span 
                key={i} 
                className={`speaking-segment ${speakingIndex === i ? 'highlighted' : ''}`}
              >
                {text}{' '}
              </span>
            ))}
          </div>
        ) : (
          <div 
            className={`rich-content-view ${isOnlyEmojis(entry.content) ? 'emoji-only-entry' : ''}`}
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        )}
      </article>

      {entry.mood && currentMoodData && (
        <div className="mood-display-card mt-5 animate-fade-in">
          <div className="mood-display-icon" style={{ backgroundColor: currentMoodData.color }}>
            {currentMoodData.icon}
          </div>
          <div className="mood-display-info">
            <span className="mood-display-label">Current Mood</span>
            <span className="mood-display-value">{currentMoodData.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalViewing;
