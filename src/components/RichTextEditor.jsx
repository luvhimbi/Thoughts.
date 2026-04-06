import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      ),
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: 'Bold'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      ),
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: 'Italic'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      ),
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      title: 'Bullet List'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"></line>
          <line x1="10" y1="12" x2="21" y2="12"></line>
          <line x1="10" y1="18" x2="21" y2="18"></line>
          <path d="M4 6h1v4"></path>
          <path d="M4 10h2"></path>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
        </svg>
      ),
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      title: 'Ordered List'
    },
  ];

  return (
    <div className="editor-menu-bar animate-fade-in d-flex gap-1 mb-4">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.preventDefault();
            btn.action();
          }}
          className={`btn-editor-tool ${btn.isActive ? 'active' : ''}`}
          title={btn.title}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder = 'Begin your reflection here...' }) => {
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

  return (
    <div className="rich-text-editor-wrapper">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="editor-content-area" />
      
      <style jsx="true">{`
        .rich-text-editor-wrapper {
          width: 100%;
        }
        .editor-menu-bar {
          padding: 4px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 14px;
          display: inline-flex !important;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }
        [data-theme="dark"] .editor-menu-bar {
          background: rgba(40, 40, 40, 0.6);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .btn-editor-tool {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 10px;
          color: var(--text-secondary);
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }
        .btn-editor-tool:hover {
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        [data-theme="dark"] .btn-editor-tool:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-editor-tool.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .btn-editor-tool svg {
          transition: transform 0.2s ease;
        }
        .btn-editor-tool.active svg {
          transform: scale(0.9);
        }
        .editor-content-area {
          min-height: 300px;
        }
        /* TipTap Specific Styling */
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

export default RichTextEditor;
