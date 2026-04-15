import { useState } from 'react';
import { useDashboard } from '../store';

interface KeyEntry {
  id: string;
  name: string;
  envVar: string;
  status: 'set' | 'unset' | 'pending';
  value: string;
}

const DEFAULT_KEYS: Omit<KeyEntry, 'status' | 'value'>[] = [
  { id: 'anthropic', name: 'Anthropic API', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'brave', name: 'Brave Search', envVar: 'BRAVE_API_KEY' },
  { id: 'supabase-url', name: 'Supabase URL', envVar: 'SUPABASE_URL' },
  { id: 'supabase-key', name: 'Supabase Service Key', envVar: 'SUPABASE_SERVICE_ROLE_KEY' },
  { id: 'openai', name: 'OpenAI API', envVar: 'OPENAI_API_KEY' },
  { id: 'github', name: 'GitHub Token', envVar: 'GITHUB_TOKEN' },
  { id: 'firecrawl', name: 'Firecrawl', envVar: 'FIRECRAWL_API_KEY' },
];

export function KeyVaultButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="key-vault__trigger" onClick={onClick} title="Key Vault">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    </button>
  );
}

export function KeyVault({ onClose }: { onClose: () => void }) {
  const { tools, sendChatMessage } = useDashboard();

  const [keys, setKeys] = useState<KeyEntry[]>(() =>
    DEFAULT_KEYS.map(k => {
      const tool = tools.find(t => t.envVar === k.envVar);
      const isSet = tool ? tool.configured === 'ready' : false;
      return { ...k, status: isSet ? 'set' as const : 'unset' as const, value: '' };
    })
  );

  const [customName, setCustomName] = useState('');
  const [customEnv, setCustomEnv] = useState('');

  function handleSave(idx: number) {
    const key = keys[idx];
    if (!key.value.trim()) return;
    // Send through chat — the store handles KEY=value patterns
    sendChatMessage(`${key.envVar}=${key.value.trim()}`);
    setKeys(prev => prev.map((k, i) =>
      i === idx ? { ...k, status: 'set', value: '' } : k
    ));
  }

  function handleAddCustom() {
    if (!customName.trim() || !customEnv.trim()) return;
    setKeys(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      envVar: customEnv.trim().toUpperCase().replace(/\s+/g, '_'),
      status: 'unset',
      value: '',
    }]);
    setCustomName('');
    setCustomEnv('');
  }

  return (
    <div className="key-vault__overlay" onClick={onClose}>
      <div className="key-vault__box" onClick={e => e.stopPropagation()}>
        <div className="key-vault__header">
          <span className="key-vault__title">Key Vault</span>
          <button className="key-vault__close" onClick={onClose}>&times;</button>
        </div>

        <div className="key-vault__list">
          {keys.map((k, i) => (
            <div key={k.id} className="key-vault__row">
              <div className="key-vault__row-info">
                <span className={`key-vault__dot key-vault__dot--${k.status}`} />
                <span className="key-vault__key-name">{k.name}</span>
                <span className="key-vault__env-var">{k.envVar}</span>
              </div>
              <div className="key-vault__row-input">
                <input
                  type="password"
                  className="key-vault__input"
                  placeholder={k.status === 'set' ? '••••••••' : 'paste key...'}
                  value={k.value}
                  onChange={e => setKeys(prev => prev.map((kk, ii) =>
                    ii === i ? { ...kk, value: e.target.value } : kk
                  ))}
                  onKeyDown={e => e.key === 'Enter' && handleSave(i)}
                />
                <button
                  className="key-vault__save-btn"
                  onClick={() => handleSave(i)}
                  disabled={!k.value.trim()}
                >
                  save
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add custom key */}
        <div className="key-vault__add">
          <input
            className="key-vault__input key-vault__input--half"
            placeholder="Name"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
          <input
            className="key-vault__input key-vault__input--half"
            placeholder="ENV_VAR"
            value={customEnv}
            onChange={e => setCustomEnv(e.target.value)}
          />
          <button
            className="key-vault__save-btn"
            onClick={handleAddCustom}
            disabled={!customName.trim() || !customEnv.trim()}
          >
            + add
          </button>
        </div>

        <div className="key-vault__footer">
          Keys are sent to the bridge and stored in your dotfiles repo.
        </div>
      </div>
    </div>
  );
}
