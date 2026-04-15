import { useDashboard } from '../store';
import { MemoryRiver } from './MemoryRiver';
import { DocumentPreview } from './DocumentPreview';
import { ProjectDrillDown } from './ProjectDrillDown';

export function RightPanel() {
  const { selectedProject, rightPanelTab, setRightPanelTab, documents } = useDashboard();

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
          className={`right-panel-tab ${rightPanelTab === 'documents' ? 'right-panel-tab--active' : ''}`}
          onClick={() => setRightPanelTab('documents')}
        >
          Documents
          {documents.length > 0 && (
            <span className="right-panel-tab__badge">{documents.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {rightPanelTab === 'memory' ? <MemoryRiver /> : <DocumentPreview />}
      </div>

      {/* Project drill-down overlays everything */}
      {selectedProject && <ProjectDrillDown />}
    </div>
  );
}
