import { Room } from "@/lib/hotel";

export function exportToCSV(guestData: any, bookedRooms: Room[], cost: number) {
  const headers = ["Guest Name", "Phone", "Email", "Duration (Days)", "Rooms", "Total Travel Time (mins)"];
  const row = [
    guestData.name,
    guestData.phone,
    guestData.email,
    guestData.duration,
    bookedRooms.map(r => r.number).join("; "),
    cost
  ];

  const csvContent = [
    headers.join(","),
    row.map(field => `"${field}"`).join(",")
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `booking_${guestData.name.replace(/\s+/g, "_")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
