// src/pages/Events/EventCard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import api from "@/lib/api";
import "./events.css";

export default function EventCard({
  event = {},
  showFavorite = false,
  onToggleFavorite,
}) {
  const {
    id,
    title,
    category,
    imageUrl,
    description,
    slotsAvailable = 0,
    slotsTotal = 0,
    isSaved = false,
  } = event;

  const eventId = String(id ?? event._id ?? "");
  const detailsPath = eventId ? `/events/${eventId}` : "/events";
  const availableValue = Number.isFinite(slotsAvailable) ? slotsAvailable : 0;
  const totalValue = Number.isFinite(slotsTotal) ? slotsTotal : availableValue;
  const availableText = `${availableValue}/${totalValue}`;
  const categoryLabel = category ?? "General";
  const categorySlug = categoryLabel.toLowerCase().replace(/\s+/g, "-");
  const [saved, setSaved] = useState(Boolean(isSaved));
  const [savingFavorite, setSavingFavorite] = useState(false);
  const safeTitle = title ?? "Event details";
  const safeDescription = description ?? "More details coming soon.";

  useEffect(() => {
    setSaved(Boolean(isSaved));
  }, [isSaved]);

  const handleToggleFavorite = async () => {
    if (!eventId || savingFavorite) {
      return;
    }

    const nextValue = !saved;
    setSaved(nextValue);
    setSavingFavorite(true);

    try {
      if (nextValue) {
        await api.post(`/api/events/${eventId}/save`);
      } else {
        await api.delete(`/api/events/${eventId}/save`);
      }
      if (onToggleFavorite) {
        onToggleFavorite(eventId || null, nextValue);
      }
    } catch (err) {
      console.error("[EventCard] Unable to toggle save", err);
      setSaved(!nextValue);
    } finally {
      setSavingFavorite(false);
    }
  };

  return (
    <article className="event-card">
      <div className="event-card__media" data-category={categorySlug}>
        <Link
          className="event-card__media-link"
          to={detailsPath}
          aria-label={`View details for ${safeTitle}`}
        >
          {imageUrl ? (
            <img className="event-image" src={imageUrl} alt={safeTitle} />
          ) : (
            <div
              className="event-image event-image--placeholder"
              aria-hidden="true"
            />
          )}
          <span className={`category-tag category-tag--${categorySlug}`}>
            {categoryLabel}
          </span>
        </Link>
        {showFavorite && (
          <button
            type="button"
            className={`event-favorite ${
              saved ? "event-favorite--active" : ""
            }`}
            onClick={handleToggleFavorite}
            aria-label={
              saved ? `Remove ${title} from saved events` : `Save ${title}`
            }
            aria-pressed={saved}
            title={saved ? "Saved to your events" : "Save this event"}
            disabled={savingFavorite}
          >
            {saved ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>

      <div className="event-card__body">
        <h3 className="event-title">{safeTitle}</h3>
        <span className="event-details-label">Details:</span>
        <p className="event-description">{safeDescription}</p>
      </div>

      <div className="event-card__footer">
        <div className="slots">
          <span className="slots-label">Slots Available</span>
          <span className="slots-numbers">{availableText}</span>
        </div>
        <Link className="more-details" to={detailsPath}>
          More Details
        </Link>
      </div>
    </article>
  );
}
