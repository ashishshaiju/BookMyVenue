export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {[
        { color: "bg-zinc-200", label: "Past / Unavailable" },
        {
          color: "bg-blue-100 border border-blue-300",
          label: "Booked by customer",
        },
        {
          color: "bg-red-100 border border-red-300",
          label: "Blocked by you",
        },
        { color: "bg-white border border-zinc-300", label: "Available" },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`h-4 w-4 rounded ${color}`} />
          <span className="text-zinc-600">{label}</span>
        </div>
      ))}
    </div>
  );
}
