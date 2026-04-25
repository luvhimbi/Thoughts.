import React, { useEffect, useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const EditorTools = ({ editor }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  return (
    <div className="editor-inline-tools d-flex gap-1 align-items-center">
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className={`btn-editor-tool ${editor.isActive('bulletList') ? 'active' : ''}`}
        title="Bullet List"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>

      <div ref={emojiRef} className="position-relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowEmoji(!showEmoji);
          }}
          className={`btn-editor-tool ${showEmoji ? 'active' : ''}`}
          title="Add Emoji"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </button>

        {showEmoji && (
          <div className="emoji-picker-container shadow-lg animate-fade-in">
            <EmojiPicker 
              onEmojiClick={(emojiData) => {
                editor.chain().focus().insertContent(emojiData.emoji).run();
                setShowEmoji(false);
              }}
              theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}
              lazyLoadEmojis={true}
              searchDisabled={true}
              skinTonesDisabled={true}
              width={280}
              height={350}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, editorRef, design = 'minimal', placeholder = 'Begin your reflection here...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  return (
    <div className="rich-text-editor-wrapper">
      <EditorContent editor={editor} className={`editor-content-area entry-design-${design}`} />
      
      <style jsx="true">{`
        .rich-text-editor-wrapper {
          width: 100%;
        }
        .editor-inline-tools {
          position: relative;
        }
        .btn-editor-tool {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-editor-tool:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }
        [data-theme="dark"] .btn-editor-tool:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-editor-tool.active {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
        .editor-content-area {
          min-height: 300px;
        }
        .ProseMirror {
          min-height: 400px;
          outline: none !important;
          font-size: 1.2rem;
          line-height: 1.8;
          color: var(--text-primary);
          padding: 10px 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-secondary);
          opacity: 0.5;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .ProseMirror li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export { EditorTools };
export default RichTextEditor;
