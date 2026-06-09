export default function SettingsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pb-20 lg:pt-16" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-2xl font-black text-white mb-2">Settings</h1>
        <p style={{ color: "var(--text2)" }} className="text-sm">
          Profile and preferences
        </p>
      </div>
    </div>
  );
}
