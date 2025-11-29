import express from "express";
import jwt from "jsonwebtoken";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { SavedEvent } from "../models/SavedEvent.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/events - list approved events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ status: "approved" }).sort({ date: 1 }).lean();
    return res.json({ events });
  } catch (err) {
    console.error("[events GET /] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// GET /api/events/saved - list saved events for the volunteer
router.get("/saved", auth, requireRole("volunteer"), async (req, res) => {
  try {
    const eventIds = await SavedEvent.find({ user: req.user.id }).distinct("event");
    if (!eventIds.length) {
      return res.json({ events: [] });
    }

    const events = await Event.find({
      _id: { $in: eventIds },
      status: "approved",
    })
      .sort({ date: 1 })
      .lean();

    return res.json({ events });
  } catch (err) {
    console.error("[events GET /saved] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// GET /api/events/:id - event details
// Approved events are visible to all.
// Pending/denied events visible only to owner or admin (if token provided).
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Try to decode token if present to determine owner/admin access
  let requester = null;
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");
  if (token) {
    try {
      requester = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      requester = null;
    }
  }

  try {
    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).json({ error: { message: "Event not found" } });
    }

    const isApproved = event.status === "approved";
    const isOwner = requester && requester.id && event.owner?.toString() === requester.id;
    const isAdmin = requester?.role === "admin";

    if (!isApproved && !(isOwner || isAdmin)) {
      return res.status(404).json({ error: { message: "Event not found" } });
    }

    return res.json({ event });
  } catch (err) {
    console.error("[events GET /:id] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// POST /api/events - organizers create pending event
router.post("/", auth, requireRole("organizer"), async (req, res) => {
  const {
    title,
    description,
    category,
    date,
    startTime,
    endTime,
    address,
    capacity,
    imageUrl,
  } = req.body || {};

  if (!title || !description || !category || !date) {
    return res.status(400).json({ error: { message: "Missing required fields" } });
  }

  try {
    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      date: new Date(date),
      startTime,
      endTime,
      address,
      capacity,
      imageUrl,
      status: "pending",
      owner: req.user.id,
    });

    return res.status(201).json({ event });
  } catch (err) {
    console.error("[events POST /] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// POST /api/events/:id/rsvp - volunteers RSVP for an event
router.post("/:id/rsvp", auth, requireRole("volunteer"), async (req, res) => {
  const { id } = req.params;
  const { hoursCommitted } = req.body || {};

  let normalizedHours;
  if (hoursCommitted !== undefined) {
    const parsed = Number(hoursCommitted);
    if (Number.isNaN(parsed) || parsed < 0) {
      return res
        .status(400)
        .json({ error: { message: "hoursCommitted must be a non-negative number" } });
    }
    normalizedHours = parsed;
  }

  try {
    const event = await Event.findById(id);
    if (!event || event.status !== "approved") {
      return res.status(404).json({ error: { message: "Event not found" } });
    }

    const existingRegistration = await Registration.findOne({ user: req.user.id, event: id });
    if (existingRegistration) {
      if (normalizedHours !== undefined) {
        existingRegistration.hoursCommitted = normalizedHours;
      }
      await existingRegistration.save();
      return res.json({ registration: existingRegistration });
    }

    const hasCapacity = typeof event.capacity === "number" && !Number.isNaN(event.capacity);
    if (hasCapacity) {
      const currentRegistrations = await Registration.countDocuments({ event: id });
      if (currentRegistrations >= event.capacity) {
        return res.status(400).json({ error: { message: "Event is full" } });
      }
    }

    const registration = await Registration.create({
      user: req.user.id,
      event: id,
      hoursCommitted: normalizedHours,
    });

    return res.status(201).json({ registration });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: { message: "You have already registered" } });
    }
    console.error("[events POST /:id/rsvp] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// DELETE /api/events/:id/rsvp - volunteers cancel RSVP
router.delete("/:id/rsvp", auth, requireRole("volunteer"), async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await Registration.findOneAndDelete({ user: req.user.id, event: id });
    if (!registration) {
      return res.status(404).json({ error: { message: "Registration not found" } });
    }

    return res.json({ message: "RSVP canceled", registration });
  } catch (err) {
    console.error("[events DELETE /:id/rsvp] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// POST /api/events/:id/save - volunteers save an event
router.post("/:id/save", auth, requireRole("volunteer"), async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event || event.status !== "approved") {
      return res.status(404).json({ error: { message: "Event not found" } });
    }

    const existing = await SavedEvent.findOne({ user: req.user.id, event: id });
    if (existing) {
      return res.json({ savedEvent: existing });
    }

    const savedEvent = await SavedEvent.create({ user: req.user.id, event: id });
    return res.status(201).json({ savedEvent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: { message: "Event already saved" } });
    }
    console.error("[events POST /:id/save] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// DELETE /api/events/:id/save - volunteers remove saved event
router.delete("/:id/save", auth, requireRole("volunteer"), async (req, res) => {
  const { id } = req.params;

  try {
    const savedEvent = await SavedEvent.findOneAndDelete({ user: req.user.id, event: id });
    if (!savedEvent) {
      return res.status(404).json({ error: { message: "Saved event not found" } });
    }

    return res.json({ message: "Event removed from saved list", savedEvent });
  } catch (err) {
    console.error("[events DELETE /:id/save] error", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

export default router;
