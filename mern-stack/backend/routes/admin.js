import express from "express";
import { Event } from "../models/Event.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/admin/events/pending - list pending events
router.get("/events/pending", auth, requireRole("admin"), async (req, res) => {
  try {
    const pendingEvents = await Event.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .populate("owner", "firstName lastName email")
      .lean();

    const events = pendingEvents.map((event) => ({
      id: event._id,
      title: event.title,
      category: event.category,
      status: event.status,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      address: event.address,
      capacity: event.capacity,
      imageUrl: event.imageUrl,
      submittedAt: event.createdAt,
      owner: event.owner
        ? {
            id: event.owner._id,
            firstName: event.owner.firstName,
            lastName: event.owner.lastName,
            email: event.owner.email,
          }
        : null,
    }));

    return res.json({ events });
  } catch (err) {
    console.error("[admin GET /events/pending] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// POST /api/admin/events/:id/approve
router.post("/events/:id/approve", auth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: { message: "Event not found" } });
    }
    event.status = "approved";
    await event.save();
    return res.json({ event });
  } catch (err) {
    console.error("[admin approve] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// POST /api/admin/events/:id/deny
router.post("/events/:id/deny", auth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: { message: "Event not found" } });
    }
    event.status = "denied";
    await event.save();
    return res.json({ event });
  } catch (err) {
    console.error("[admin deny] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

export default router;
