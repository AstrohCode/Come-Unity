// Utility helpers for working with event payloads from the API
export const mapEventsFromApi = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((event, index) => {
      if (!event || typeof event !== "object") {
        return null;
      }

      const ownerValue = event.owner ?? event.ownerId ?? null;
      const ownerId =
        ownerValue && typeof ownerValue === "object"
          ? ownerValue.id ?? ownerValue._id ?? null
          : ownerValue ?? null;

      const available =
        typeof event.slotsAvailable === "number"
          ? event.slotsAvailable
          : typeof event.capacity === "number"
          ? event.capacity
          : 0;

      const total =
        typeof event.slotsTotal === "number"
          ? event.slotsTotal
          : typeof event.capacity === "number"
          ? event.capacity
          : available;

      return {
        id: String(event.id ?? event._id ?? `event-${index}`),
        title: event.title ?? "Untitled Event",
        category: event.category ?? "General",
        description: event.description ?? "Details coming soon.",
        imageUrl: event.imageUrl ?? event.image ?? "",
        slotsAvailable: available,
        slotsTotal: total,
        ownerId: ownerId ? String(ownerId) : null,
        status: event.status ?? "pending",
      };
    })
    .filter(Boolean);
};
