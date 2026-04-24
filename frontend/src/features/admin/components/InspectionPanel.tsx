import { useAdminRuntime } from "../AdminRuntime";

export function InspectionPanel() {
  const { settings, error, logs } = useAdminRuntime();

  return (
    <aside className="inspection-panel">
      <section className="inspection-panel__section">
        <h3>Context Node Memory</h3>
        <div className="inspection-code">
          <strong>MEMORY.md</strong>
          <pre>{`# User Preferences
- tone: strictly_professional
- priority: latency_first
- allowed_models: ["claude-3-5-sonnet"]`}</pre>
        </div>
        <div className="inspection-code">
          <strong>HISTORY.md</strong>
          <pre>{`2026-04-24 09:00 - Sprint driver heartbeat active
2026-04-24 12:23 - Admin registry sync refreshed
2026-04-24 12:44 - OpenClaw telemetry sample updated`}</pre>
        </div>
      </section>

      <section className="inspection-panel__section">
        <h4>Global Configuration</h4>
        <div className="settings-row">
          <span>STT Processing</span>
          <button
            className={settings?.stt_enabled ? "toggle toggle--on" : "toggle"}
            aria-label="STT enabled"
            type="button"
          />
        </div>
        <div className="settings-row">
          <span>TTS Synthesis</span>
          <button
            className={settings?.tts_enabled ? "toggle toggle--on" : "toggle"}
            aria-label="TTS enabled"
            type="button"
          />
        </div>
        <div className="settings-slider">
          <span>Inference Rate Limit (req/min)</span>
          <input
            defaultValue={settings?.inference_rate_limit ?? 500}
            max={1000}
            min={10}
            type="range"
          />
          <div className="settings-slider__labels">
            <span>10</span>
            <strong>Current: {settings?.inference_rate_limit ?? 500}</strong>
            <span>1000</span>
          </div>
        </div>
        <button className="button" type="button">
          {error ? "Config com alerta" : `Ultimos logs: ${logs.length}`}
        </button>
      </section>
    </aside>
  );
}
