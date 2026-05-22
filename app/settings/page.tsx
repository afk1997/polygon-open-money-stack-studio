import { getSettingsStatus } from "@/lib/ai-providers";

export default function SettingsPage() {
  const settings = getSettingsStatus();
  const codexStatus = settings.codexBridgeEnabled ? "configured" : "not configured";

  return (
    <main className="settingsPage">
      <section className="settingsPanel">
        <a href="/">Back to studio</a>
        <p>Hidden settings</p>
        <h1>Runtime status</h1>
        <span>
          This page reports environment configuration only. API keys are never shown or collected in the browser.
        </span>

        <div className="settingsGrid">
          <article>
            <strong>Preferred provider</strong>
            <code>{settings.preferredProvider}</code>
          </article>
          <article>
            <strong>Codex bridge</strong>
            <code>{codexStatus}</code>
          </article>
          {settings.providers.map((provider) => (
            <article key={provider.provider}>
              <strong>{provider.provider}</strong>
              <code>{provider.configured ? "configured" : "missing env"}</code>
              <span>Model: {provider.modelConfigured ? provider.model : "not configured"}</span>
              <span>Missing: {provider.missing.length > 0 ? provider.missing.join(", ") : "none"}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
