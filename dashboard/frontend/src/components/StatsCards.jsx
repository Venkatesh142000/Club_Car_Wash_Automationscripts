function StatCard({ label, value, meta, tone = "blue" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-meta">{meta}</div>
    </div>
  );
}

export default function StatsCards({ totalCases, totalFiles, pageFiles, totalLocators }) {
  return (
    <section className="stats-grid">
      <StatCard
        label="Total Testcases"
        value={totalCases}
        meta={`Across ${totalFiles} scripts`}
        tone="blue"
      />
      <StatCard
        label="Test Scripts"
        value={totalFiles}
        meta="Live from tests folder"
        tone="green"
      />
      <StatCard
        label="Pages"
        value={pageFiles}
        meta="Live from pages folder"
        tone="purple"
      />
      <StatCard
        label="Locators Count"
        value={totalLocators}
        meta="Page Objects"
        tone="purple"
      />
    </section>
  );
}
