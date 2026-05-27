import { useEffect, useRef, useState } from 'react';
import { useDashboard } from '../store';
import { MemoryRiver } from './MemoryRiver';
import { DocumentPreview } from './DocumentPreview';
import { FileEditor } from './FileEditor';
import { ProjectDrillDown } from './ProjectDrillDown';
import { BrainNodeDrillDown } from './BrainNodeDrillDown';

const LEARNING_STATUS_ICONS: Record<string, string> = {
  active: '',
  argued: '(debated)',
  revised: '(revised)',
  rejected: '(rejected)',
};

function timeAgoLong(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function LearningFeed() {
  const { learnings, sendChatMessage } = useDashboard();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleArgue(l: typeof learnings[0]) {
    sendChatMessage(`I want to argue this learning:\n\n**Rule:** ${l.rule}\n**Based on:** ${l.content}\n**Project:** ${l.project}\n\nLet's debate whether this is still the right behavioral rule.`);
  }

  return (
    <div className="learning-feed">
      {learnings.map(l => {
        const isExpanded = expandedId === l.id;
        return (
          <div key={l.id} className={`learning-feed__item learning-feed__item--${l.domain} ${l.status === 'rejected' ? 'learning-feed__item--rejected' : ''}`}>
            <div className="learning-feed__domain">
              {l.domain}
              {l.status !== 'active' && (
                <span className="learning-feed__status">{LEARNING_STATUS_ICONS[l.status]}</span>
              )}
              <span className="learning-feed__time">{timeAgoLong(l.timestamp)}</span>
            </div>
            <div className="learning-feed__rule">{l.rule}</div>
            <div className="learning-feed__meta">
              <span className="learning-feed__project">{l.project}</span>
              <span
                className="learning-feed__provenance"
                onClick={() => setExpandedId(isExpanded ? null : l.id)}
                title="Show source memories"
              >
                {l.sourceMemoryIds.length} source{l.sourceMemoryIds.length !== 1 ? 's' : ''}
              </span>
              <button
                className="learning-feed__argue"
                onClick={() => handleArgue(l)}
                title="Debate this learning in chat"
              >
                Argue
              </button>
            </div>
            {isExpanded && (
              <div className="learning-feed__evidence">
                <div className="learning-feed__evidence-label">Evidence:</div>
                <div className="learning-feed__evidence-content">{l.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RightPanel() {
  const { selectedProject, selectedBrainNode, rightPanelTab, setRightPanelTab, documents, uploadedDocuments, learnings } = useDashboard();
  const [hasNewLearning, setHasNewLearning] = useState(false);
  const prevLearningCountRef = useRef(learnings.length);

  useEffect(() => {
    const prev = prevLearningCountRef.current;
    prevLearningCountRef.current = learnings.length;
    if (learnings.length > prev && rightPanelTab !== 'learnings') {
      setHasNewLearning(true);
    }
  }, [learnings.length, rightPanelTab]);

  useEffect(() => {
    if (rightPanelTab === 'learnings' && hasNewLearning) setHasNewLearning(false);
  }, [rightPanelTab, hasNewLearning]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Tab bar */}
      <div className="right-panel-tabs">
        <button
          className={`right-panel-tab ${rightPanelTab === 'memory' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('memory')}
        >
          Memory
        </button>
        <button
          className={`right-panel-tab ${rightPanelTab === 'learnings' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('learnings')}
        >
          Learnings
          {hasNewLearning && <span className="right-panel-tab__blink" aria-label="new learning" />}
          {learnings.length > 0 && (
            <span className="right-panel-tab__badge">{learnings.length}</span>
          )}
        </button>
        <button
          className={`right-panel-tab ${rightPanelTab === 'documents' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('documents')}
        >
          Generated Docs
          {documents.length > 0 && (
            <span className="right-panel-tab__badge">{documents.length}</span>
          )}
        </button>
        <button
          className={`right-panel-tab ${rightPanelTab === 'uploaded' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('uploaded')}
        >
          Uploaded Docs
          {uploadedDocuments.length > 0 && (
            <span className="right-panel-tab__badge">{uploadedDocuments.length}</span>
          )}
        </button>
        <button
          className={`right-panel-tab ${rightPanelTab === 'editor' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('editor')}
        >
          Editor
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {rightPanelTab === 'memory' ? <MemoryRiver /> :
         rightPanelTab === 'learnings' ? <LearningFeed /> :
         rightPanelTab === 'documents' ? <DocumentPreview docs={documents} emptyMessage="documents will appear here as the active engine creates files" /> :
         rightPanelTab === 'uploaded' ? <DocumentPreview docs={uploadedDocuments} emptyMessage="attach a file in chat and it will show up here" /> :
         <FileEditor />}
      </div>

      {/* Drill-downs overlay everything */}
      {selectedProject && <ProjectDrillDown />}
      {selectedBrainNode && !selectedProject && <BrainNodeDrillDown />}
    </div>
  );
}
