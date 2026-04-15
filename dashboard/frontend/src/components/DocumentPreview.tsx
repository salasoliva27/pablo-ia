import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDashboard } from '../store';
import type { Document } from '../types/dashboard';

function CodeView({ doc }: { doc: Document }) {
  const lines = doc.content.split('\n');
  return (
    <div className="doc-preview__code">
      {lines.map((line, i) => (
        <div key={i} className="doc-preview__code-line">
          <span className="doc-preview__line-no">{i + 1}</span>
          <span>{line || ' '}</span>
        </div>
      ))}
    </div>
  );
}

function MarkdownView({ doc }: { doc: Document }) {
  return (
    <div className="doc-preview__markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return <code {...props}>{children}</code>;
            }
            return <pre><code className={className} {...props}>{children}</code></pre>;
          },
          a({ href, children, ...props }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
        }}
      >
        {doc.content}
      </ReactMarkdown>
    </div>
  );
}

function HtmlView({ doc }: { doc: Document }) {
  const srcDoc = useMemo(() => {
    // Wrap in a basic document with white background
    if (doc.content.includes('<html') || doc.content.includes('<!DOCTYPE')) {
      return doc.content;
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:16px;font-family:system-ui,sans-serif;}</style></head><body>${doc.content}</body></html>`;
  }, [doc.content]);

  return (
    <iframe
      className="doc-preview__html-frame"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      title={doc.filename}
    />
  );
}

function JsonView({ doc }: { doc: Document }) {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(doc.content), null, 2);
    } catch {
      return doc.content;
    }
  }, [doc.content]);

  return (
    <div className="doc-preview__code">
      {formatted.split('\n').map((line, i) => (
        <div key={i} className="doc-preview__code-line">
          <span className="doc-preview__line-no">{i + 1}</span>
          <span>{line || ' '}</span>
        </div>
      ))}
    </div>
  );
}

function SvgView({ doc }: { doc: Document }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: 16, background: 'oklch(0.95 0 0)', borderRadius: 4,
      }}
      dangerouslySetInnerHTML={{ __html: doc.content }}
    />
  );
}

function DocContent({ doc }: { doc: Document }) {
  switch (doc.language) {
    case 'markdown':
      return <MarkdownView doc={doc} />;
    case 'html':
      return <HtmlView doc={doc} />;
    case 'json':
      return <JsonView doc={doc} />;
    case 'svg':
      return <SvgView doc={doc} />;
    case 'image':
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <img src={doc.path} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: '100%' }} />
        </div>
      );
    default:
      return <CodeView doc={doc} />;
  }
}

export function DocumentPreview() {
  const { documents, activeDocumentId, setActiveDocument } = useDashboard();

  if (documents.length === 0) {
    return (
      <div className="doc-preview">
        <div className="doc-preview__empty">
          documents will appear here as Claude creates files
        </div>
      </div>
    );
  }

  const activeDoc = documents.find(d => d.id === activeDocumentId) || documents[0];

  return (
    <div className="doc-preview">
      {/* Tabs for open documents */}
      <div className="doc-preview__tabs">
        {documents.slice(0, 15).map(doc => (
          <button
            key={doc.id}
            className={`doc-preview__tab ${doc.id === activeDoc.id ? 'doc-preview__tab--active' : ''}`}
            onClick={() => setActiveDocument(doc.id)}
            title={doc.path}
          >
            {doc.filename}
            <span className="doc-preview__tab-lang">{doc.language}</span>
          </button>
        ))}
      </div>

      {/* File path bar + download */}
      <div className="doc-preview__path">
        <span>{activeDoc.path}</span>
        <button
          className="doc-preview__download"
          onClick={() => {
            const blob = new Blob([activeDoc.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = activeDoc.filename;
            a.click();
            URL.revokeObjectURL(url);
          }}
          title="Download file"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="doc-preview__content">
        <DocContent doc={activeDoc} />
      </div>
    </div>
  );
}
