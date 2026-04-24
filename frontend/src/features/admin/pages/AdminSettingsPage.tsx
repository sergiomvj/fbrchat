import { useEffect, useState } from "react";
import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

export function AdminSettingsPage() {
  const { settings, saveSettings } = useAdminRuntime();
  const [draft, setDraft] = useState({
    stt_enabled: true,
    tts_enabled: true,
    inference_rate_limit: 500
  });

  useEffect(() => {
    if (!settings) return;
    setDraft(settings);
  }, [settings]);

  return (
    <AdminPageLayout
      title="Settings"
      subtitle="Controles persistidos de STT, TTS e taxa de inferencia."
      actions={
        <button
          className="button"
          onClick={() => saveSettings(draft)}
          type="button"
        >
          Salvar Alteracoes
        </button>
      }
    >
      <section className="inspection-panel__section">
        <div className="settings-row">
          <span>STT Processing</span>
          <button
            className={draft.stt_enabled ? "toggle toggle--on" : "toggle"}
            onClick={() =>
              setDraft((current) => ({ ...current, stt_enabled: !current.stt_enabled }))
            }
            aria-label="STT enabled"
            type="button"
          />
        </div>
        <div className="settings-row">
          <span>TTS Synthesis</span>
          <button
            className={draft.tts_enabled ? "toggle toggle--on" : "toggle"}
            onClick={() =>
              setDraft((current) => ({ ...current, tts_enabled: !current.tts_enabled }))
            }
            aria-label="TTS enabled"
            type="button"
          />
        </div>
        <div className="settings-slider">
          <span>Inference Rate Limit (req/min)</span>
          <input
            max={1000}
            min={10}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                inference_rate_limit: Number(event.target.value)
              }))
            }
            type="range"
            value={draft.inference_rate_limit}
          />
          <div className="settings-slider__labels">
            <span>10</span>
            <strong>Current: {draft.inference_rate_limit}</strong>
            <span>1000</span>
          </div>
        </div>
      </section>
    </AdminPageLayout>
  );
}
