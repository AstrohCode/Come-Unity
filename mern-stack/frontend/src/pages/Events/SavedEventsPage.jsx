import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import VolunteerLayout from "@/pages/Events/layouts/VolunteerLayout";
import EventCard from "@/pages/Events/EventCard";
import api from "@/lib/api";
import { mapEventsFromApi } from "@/utils/events";
import logoClear from "@/assets/Logo (clear).png";
import profileBadge from "@/assets/6 1.png";
import calendarIcon from "@/assets/Calender image.png";
import favoriteIcon from "@/assets/Favorite.png";
import dashboardIcon from "@/assets/dashboard.png";
import "./saved-events.css";

const volunteerNavLinks = [
  { label: "Events", href: "/events", icon: calendarIcon, iconAlt: "Events" },
  {
    label: "Saved Events",
    href: "/events/saved",
    icon: favoriteIcon,
    iconAlt: "Saved events",
  },
  {
    label: "Dashboard",
    href: "/dashboard/volunteer",
    icon: dashboardIcon,
    iconAlt: "Volunteer dashboard",
  },
];

export default function SavedEventsPage({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [pendingRemovalIds, setPendingRemovalIds] = useState([]);
  const isVolunteer = user?.role ? user.role === "volunteer" : true;

  const navLinks = useMemo(
    () =>
      volunteerNavLinks.map((link) =>
        link.href === "/events/saved"
          ? { ...link, active: true }
          : { ...link, active: false }
      ),
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadSavedEvents = async () => {
      if (!isVolunteer) {
        setLoading(false);
        setEvents([]);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await api.get("/api/events/saved");
        const normalized = mapEventsFromApi(data?.events).map((event) => ({
          ...event,
          isSaved: true,
        }));
        if (isMounted) {
          setEvents(normalized);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load saved events.");
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSavedEvents();

    return () => {
      isMounted = false;
    };
  }, [isVolunteer]);

  if (user && !isVolunteer) {
    return <Navigate to="/events" replace />;
  }

  const handleUnsave = async (eventId) => {
    if (!eventId) {
      return;
    }

    setPendingRemovalIds((current) => Array.from(new Set([...current, eventId])));
    const previousEvents = events;
    setEvents((current) => current.filter((event) => event.id !== eventId));

    try {
      await api.delete(`/api/events/${eventId}/save`);
    } catch (err) {
      setError(err.message || "Unable to update saved events.");
      setEvents(previousEvents);
    } finally {
      setPendingRemovalIds((current) => current.filter((id) => id !== eventId));
    }
  };

  const savedCount = events.length;

  return (
    <VolunteerLayout
      navLinks={navLinks}
      roleLabel="Volunteer"
      logoSrc={logoClear}
      profileIcon={profileBadge}
      onLogout={onLogout}
    >
      <div className="saved-events">
        <header className="saved-events__header">
          <div>
            <p className="saved-events__eyebrow">Bookmarked opportunities</p>
            <h1>Saved Events</h1>
            <p>Review your short list and lock in the ones you can attend.</p>
          </div>
          <div className="saved-events__badge">
            {loading ? "Loading" : `${savedCount} saved`}
          </div>
        </header>

        {error && !loading && (
          <div className="saved-events__error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="saved-events__skeleton-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="saved-events__card-skeleton" />
            ))}
          </div>
        ) : savedCount ? (
          <div className="saved-events__grid">
            {events.map((event) => (
              <article key={event.id} className="saved-events__item">
                <EventCard event={event} />
                <div className="saved-events__actions">
                  <button
                    type="button"
                    className="saved-events__ghost saved-events__ghost--full"
                    onClick={() => handleUnsave(event.id)}
                    disabled={pendingRemovalIds.includes(event.id)}
                  >
                    {pendingRemovalIds.includes(event.id)
                      ? "Removing..."
                      : "Remove bookmark"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="saved-events__empty">
            <h2>No saved events</h2>
            <p>Tap the heart icon on events to revisit them here when you are ready.</p>
            <a className="saved-events__ghost" href="/events">
              Explore events
            </a>
          </div>
        )}
      </div>
    </VolunteerLayout>
  );
}
