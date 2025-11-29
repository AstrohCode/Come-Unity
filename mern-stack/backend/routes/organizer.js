import express from "express";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/organizer/events - events owned by the organizer with metrics
router.get("/events", auth, requireRole("organizer"), async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.id }).sort({ date: 1 }).lean();
    const eventIds = events.map((event) => event._id).filter(Boolean);

    let registrationCounts = new Map();
    if (eventIds.length) {
      const stats = await Registration.aggregate([
        { $match: { event: { $in: eventIds } } },
        { $group: { _id: "$event", count: { $sum: 1 } } },
      ]);
      registrationCounts = new Map(
        stats.map((entry) => [String(entry._id), entry.count || 0])
      );
    }

    const now = new Date();
    let totalVolunteers = 0;

    const eventsWithStats = events.map((event) => {
      const eventId = String(event._id);
      const volunteerCount = registrationCounts.get(eventId) || 0;
      totalVolunteers += volunteerCount;

      const hasCapacity = typeof event.capacity === "number" && !Number.isNaN(event.capacity);
      const slotsTotal = hasCapacity ? event.capacity : null;
      const slotsAvailable = hasCapacity
        ? Math.max(event.capacity - volunteerCount, 0)
        : null;

      return {
        ...event,
        volunteerCount,
        slotsAvailable,
        slotsTotal,
      };
    });

    const upcomingEvents = events.filter((event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate > now;
    }).length;

    return res.json({
      events: eventsWithStats,
      metrics: {
        upcomingEvents,
        eventsCreated: events.length,
        totalVolunteers,
      },
    });
  } catch (err) {
    console.error("[organizer GET /events] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

export default router;
