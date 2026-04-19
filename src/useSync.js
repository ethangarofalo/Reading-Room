import React from 'react';
import { loadSyncConfig, pullRoom, pushRoom, mergeStates } from './sync.js';

const PULL_INTERVAL_MS = 30_000;
const PUSH_DEBOUNCE_MS = 2_000;

export function useSync(state, setState) {
  const [config, setConfig] = React.useState(() => loadSyncConfig());
  const [status, setStatus] = React.useState('idle'); // idle | syncing | ok | error | offline
  const [lastError, setLastError] = React.useState(null);

  const versionRef = React.useRef(0);
  const lastSerializedRef = React.useRef(null);
  const pushTimerRef = React.useRef(null);
  const stateRef = React.useRef(state);
  React.useEffect(() => { stateRef.current = state; }, [state]);

  const doPull = React.useCallback(async (cfg) => {
    if (!cfg) return undefined;
    setStatus('syncing');
    try {
      const remote = await pullRoom(cfg);
      if (remote) {
        versionRef.current = remote.version;
        setState((local) => {
          const merged = mergeStates(local, remote.state);
          lastSerializedRef.current = JSON.stringify(merged);
          return merged;
        });
      }
      setStatus('ok');
      setLastError(null);
      return remote;
    } catch (err) {
      setStatus('error');
      setLastError(err.message);
      return undefined;
    }
  }, [setState]);

  const doPush = React.useCallback(async (cfg) => {
    if (!cfg) return;
    const snapshot = stateRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSerializedRef.current) return;
    setStatus('syncing');
    try {
      const result = await pushRoom(cfg, snapshot, versionRef.current || undefined);
      if (result.conflict) {
        const merged = mergeStates(snapshot, result.state);
        versionRef.current = result.version;
        setState(merged);
        const retry = await pushRoom(cfg, merged, result.version);
        if (!retry.conflict) {
          versionRef.current = retry.version;
          lastSerializedRef.current = JSON.stringify(merged);
        }
      } else {
        versionRef.current = result.version;
        lastSerializedRef.current = serialized;
      }
      setStatus('ok');
      setLastError(null);
    } catch (err) {
      setStatus('error');
      setLastError(err.message);
    }
  }, [setState]);

  // Initial pull when config is set/changed
  React.useEffect(() => {
    if (!config) { setStatus('idle'); return; }
    versionRef.current = 0;
    lastSerializedRef.current = null;
    let cancelled = false;
    (async () => {
      const remote = await doPull(config);
      if (!cancelled && remote === null) {
        lastSerializedRef.current = JSON.stringify(null);
        await doPush(config);
      }
    })();
    return () => { cancelled = true; };
  }, [config, doPull, doPush]);

  // Periodic pull
  React.useEffect(() => {
    if (!config) return;
    const i = setInterval(() => doPull(config), PULL_INTERVAL_MS);
    const onVis = () => { if (!document.hidden) doPull(config); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(i);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [config, doPull]);

  // Debounced push on state change
  React.useEffect(() => {
    if (!config) return;
    if (lastSerializedRef.current == null) return; // wait for first pull to finish
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => doPush(config), PUSH_DEBOUNCE_MS);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [state, config, doPush]);

  const syncNow = React.useCallback(async () => {
    if (!config) return;
    await doPush(config);
    await doPull(config);
  }, [config, doPush, doPull]);

  return { config, setConfig, status, lastError, syncNow };
}
