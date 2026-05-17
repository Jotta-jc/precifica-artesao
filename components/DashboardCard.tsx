type DashboardCardProps = {
  title: string;
  value: string;
};

export function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "32px",
        border: "1px solid #e5e7eb",
        width: "100%",
       minWidth: "280px",
flex: 1,
      }}
    >
      <h3
        style={{
          fontSize: "32px",
          color: "#111827",
          marginBottom: "20px",
        }}
      >
        {title}
      </h3>

      <strong
        style={{
          fontSize: "72px",
          color: "#111827",
        }}
      >
        {value}
      </strong>
    </div>
  );
}