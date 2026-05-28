const trend = [
  { label: "1월", total: 18000, loss: 22 },
  { label: "2월", total: 18200, loss: 38 },
  { label: "3월", total: 18350, loss: 41 },
  { label: "4월", total: 18420, loss: 57 },
  { label: "5월", total: 18420, loss: 31 },
];

export default function InventoryTrend() {
  const max = Math.max(...trend.map((t) => t.loss));
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>기간별 LOSS 추이</h2>
        <div className="filters">
          <select defaultValue="2026"><option>2026</option><option>2025</option></select>
          <select defaultValue="month"><option value="month">월별</option><option value="quarter">분기별</option><option value="year">연도별</option></select>
          <input type="date" defaultValue="2026-01-01" />
          <input type="date" defaultValue="2026-05-03" />
        </div>
      </div>
      <div className="bar-chart">
        {trend.map((item) => (
          <div className="bar-item" key={item.label}>
            <div className="bar-bg">
              <div className="bar-fill" style={{ height: `${(item.loss / max) * 100}%` }} />
            </div>
            <b>{item.loss}개</b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
