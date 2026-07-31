// ---------------------------------------------------------------------------
// Delivery slots
// ---------------------------------------------------------------------------

export interface DeliverySlot {
  id: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  capacity: "alta" | "media" | "baja" | "completa";
  spotsLeft: number;
  totalSpots: number;
  express?: boolean;
}

export const deliverySlots: DeliverySlot[] = [
  { id: "slot-hoy-express", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "En 45 min aprox.", capacity: "media", spotsLeft: 4, totalSpots: 10, express: true },
  { id: "slot-hoy-1", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "18:00 – 20:00", capacity: "baja", spotsLeft: 2, totalSpots: 14 },
  { id: "slot-hoy-2", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "20:00 – 22:00", capacity: "media", spotsLeft: 6, totalSpots: 14 },
  { id: "slot-manana-1", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "09:00 – 11:00", capacity: "alta", spotsLeft: 12, totalSpots: 14 },
  { id: "slot-manana-2", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "11:00 – 13:00", capacity: "alta", spotsLeft: 11, totalSpots: 14 },
  { id: "slot-manana-3", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "16:00 – 18:00", capacity: "completa", spotsLeft: 0, totalSpots: 14 },
  { id: "slot-sab-1", dayLabel: "Sábado", dateLabel: "1 ago", timeRange: "10:00 – 12:00", capacity: "alta", spotsLeft: 14, totalSpots: 14 },
  { id: "slot-sab-2", dayLabel: "Sábado", dateLabel: "1 ago", timeRange: "14:00 – 16:00", capacity: "media", spotsLeft: 7, totalSpots: 14 },
];
