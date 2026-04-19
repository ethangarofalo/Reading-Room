import React from 'react';
import QRCode from 'qrcode';
import {
  generateRoom, saveSyncConfig, encodePairingPayload, decodePairingPayload,
} from './sync.js';

const DEFAULT_RELAY = import.meta.env.VITE_SYNC_URL || '';

export function SyncPanel({ sync }) {
  const { config, setConfig, status, lastError, syncNow } = sync;
  const [relayUrl, setRelayUrl] = React.useState(config?.relayUrl || DEFAULT_RELAY);
  const [pairToken, setPairToken] = React.useState('');
  const [qrDataUrl, setQrDataUrl] = React.useState(null);
  const [showToken, setShowToken] = React.useState(false);

  React.useEffect(() => {
    if (!config) { setQrDataUrl(null); return; }
    const token = encodePairingPayload(config);
    QRCode.toDataURL(token, { margin: 1, scale: 6 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [config]);

  const startNewRoom = () => {
    if (!relayUrl) { alert('Set a relay URL first.'); return; }
    const { roomId, secret } = generateRoom();
    const next = { relayUrl: relayUrl.trim(), roomId, secret };
    saveSyncConfig(next);
    setConfig(next);
  };

  const joinFromToken = () => {
    const decoded = decodePairingPayload(pairToken.trim());
    if (!decoded) { alert('Pairing code is invalid.'); return; }
    saveSyncConfig(decoded);
    setConfig(decoded);
    setPairToken('');
  };

  const disconnect = () => {
    if (!confirm('Stop syncing? Local data stays.')) return;
    saveSyncConfig(null);
    setConfig(null);
  };

  const copyToken = async () => {
    if (!config) return;
    try {
      await navigator.clipboard.writeText(encodePairingPayload(config));
      alert('Pairing code copied.');
    } catch {
      setShowToken(true);
    }
  };

  const statusLabel = {
    idle: 'not syncing', syncing: 'syncing…', ok: 'in sync',
    error: `error: ${lastError || 'unknown'}`, offline: 'offline',
  }[status] || status;

  return (
    <div className="sync-panel">
      {!config && (
        <>
          <div className="tweaks-row">
            <label>Relay URL</label>
            <input
              type="url"
              className="sync-input"
              placeholder="https://reading-room-sync.you.workers.dev"
              value={relayUrl}
              onChange={(e) => setRelayUrl(e.target.value)}
            />
          </div>
          <div className="tweaks-row">
            <label>Start</label>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button className="btn small" onClick={startNewRoom} disabled={!relayUrl}>
                Create room
              </button>
            </div>
          </div>
          <div className="tweaks-row">
            <label>Join existing</label>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', flex: 1 }}>
              <input
                type="text"
                className="sync-input"
                placeholder="paste pairing code"
                value={pairToken}
                onChange={(e) => setPairToken(e.target.value)}
              />
              <button className="btn small" onClick={joinFromToken} disabled={!pairToken.trim()}>
                Join
              </button>
            </div>
          </div>
        </>
      )}

      {config && (
        <>
          <div className="tweaks-row">
            <label>Status</label>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className={`sync-dot status-${status}`} />
              <span className="muted" style={{ fontSize: 13 }}>{statusLabel}</span>
              <button className="btn small ghost" onClick={syncNow}>Sync now</button>
            </div>
          </div>

          {qrDataUrl && (
            <div className="tweaks-row">
              <label>Pair another device</label>
              <div className="sync-pair">
                <img src={qrDataUrl} alt="Pairing QR" className="sync-qr" />
                <div className="row" style={{ gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="muted" style={{ fontSize: 12 }}>Scan on your other device, or copy the code.</span>
                  <button className="btn small" onClick={copyToken}>Copy pairing code</button>
                </div>
              </div>
              {showToken && (
                <textarea readOnly className="sync-input" rows="3" value={encodePairingPayload(config)} />
              )}
            </div>
          )}

          <div className="tweaks-row">
            <label>Disconnect</label>
            <button className="btn small ghost" onClick={disconnect}>Stop syncing</button>
          </div>
        </>
      )}
    </div>
  );
}
