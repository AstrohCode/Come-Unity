import mongoose from "mongoose";

const savedEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  },
  { timestamps: true }
);

savedEventSchema.index({ user: 1, event: 1 }, { unique: true });

export const SavedEvent = mongoose.model("SavedEvent", savedEventSchema);
