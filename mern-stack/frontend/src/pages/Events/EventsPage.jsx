// src/pages/Events/EventsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { mapEventsFromApi } from "@/utils/events";
import EventCard from "./EventCard";
import VolunteerLayout from "./layouts/VolunteerLayout";
import OrganizerLayout from "./layouts/OrganizerLayout";
import AdminLayout from "./layouts/AdminLayout";
import logoClear from "@/assets/Logo (clear).png";
import profileBadge from "@/assets/6 1.png";
import calendarIcon from "@/assets/Calender image.png";
import favoriteIcon from "@/assets/Favorite.png";
import addEventIcon from "@/assets/add-event.png";
import dashboardIcon from "@/assets/dashboard.png";
import "./events.css";

const roleConfig = {
  volunteer: {
    variant: "volunteer",
    navLinks: [
      {
        label: "Events",
        href: "/events",
        active: true,
        icon: calendarIcon,
        iconAlt: "Calendar icon",
      },
      {
        label: "Saved Events",
        href: "/events/saved",
        icon: favoriteIcon,
        iconAlt: "Saved events icon",
      },
      {
        label: "Dashboard",
        href: "/dashboard/volunteer",
        icon: dashboardIcon,
        iconAlt: "Dashboard icon",
      },
    ],
    roleLabel: "Volunteer",
    title: "Discover Community Event",
    subtitle: "Find opportunities that match your interests",
    eventsHeading: "Up Coming Events...",
    showFavorites: true,
    showCreateButton: false,
    logoSrc: logoClear,
    profileIcon: profileBadge,
  },
  organizer: {
    variant: "organizer",
    navLinks: [
      {
        label: "Events",
        href: "/events",
        active: true,
        icon: calendarIcon,
        iconAlt: "Calendar icon",
      },
      {
        label: "Create Event",
        href: "/events/create",
        icon: addEventIcon,
        iconAlt: "Create event icon",
      },
      {
        label: "Dashboard",
        href: "/dashboard/organizer",
        icon: dashboardIcon,
        iconAlt: "Dashboard icon",
      },
    ],
    roleLabel: "Organizer",
    title: "Discover Community Event",
    subtitle: "Find opportunities that match your interests",
    eventsHeading: "Up Coming Events...",
    showFavorites: false,
    showCreateButton: true,
    createButtonLabel: "Create Event",
    logoSrc: logoClear,
    profileIcon: profileBadge,
  },
  admin: {
    variant: "admin",
    navLinks: [
      {
        label: "Events",
        href: "/events",
        active: true,
        icon: calendarIcon,
        iconAlt: "Calendar icon",
      },
      {
        label: "Dashboard",
        href: "/dashboard/admin",
        icon: dashboardIcon,
        iconAlt: "Dashboard icon",
      },
    ],
    roleLabel: "Admin",
    title: "Live Community Events",
    subtitle: "Keeping the Community Safe",
    eventsHeading: "Up Coming Events...",
    showFavorites: false,
    showCreateButton: false,
    logoSrc: logoClear,
    profileIcon: profileBadge,
  },
};

const Layouts = {
  volunteer: VolunteerLayout,
  organizer: OrganizerLayout,
  admin: AdminLayout,
};

export default function EventsPage({ user, onLogout }) {
  const role = user?.role ?? "volunteer";
  const config = roleConfig[role] ?? roleConfig.volunteer;
  const LayoutComponent = Layouts[role] ?? VolunteerLayout;
  const isOrganizer = role === "organizer";
  const userId = user?.id ?? user?._id ?? "";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizerToast, setOrganizerToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [savedEventIds, setSavedEventIds] = useState([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/events");
      const normalized = mapEventsFromApi(data?.events);
      setEvents(normalized);
    } catch (err) {
      setError(err.message || "Unable to load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchSavedEvents = useCallback(async () => {
    if (role !== "volunteer") {
      setSavedEventIds([]);
      return;
    }

    try {
      const data = await api.get("/api/events/saved");
      const normalized = mapEventsFromApi(data?.events);
      setSavedEventIds(normalized.map((event) => event.id));
    } catch (err) {
      console.error("[events fetchSavedEvents]", err);
      setSavedEventIds([]);
    }
  }, [role]);

  useEffect(() => {
    fetchSavedEvents();
  }, [fetchSavedEvents]);

  const savedIdsSet = useMemo(() => new Set(savedEventIds), [savedEventIds]);
  const decoratedEvents = useMemo(
    () => events.map((event) => ({ ...event, isSaved: savedIdsSet.has(event.id) })),
    [events, savedIdsSet]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(decoratedEvents.map((event) => event.category).filter(Boolean))
      ),
    [decoratedEvents]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    return decoratedEvents.filter((event) => {
      const matchesCategory = selectedCategory
        ? event.category === selectedCategory
        : true;
      if (!matchesCategory) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [event.title, event.category, event.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [decoratedEvents, normalizedQuery, selectedCategory]);

  const hasResults = filteredEvents.length > 0;

  const handleOrganizerEdit = (eventItem) => {
    setOrganizerToast(`Edit flow prep for "${eventItem.title}".`);
  };

  const handleOrganizerDelete = (eventItem) => {
    setEvents((current) => current.filter((event) => event.id !== eventItem.id));
    setOrganizerToast(`"${eventItem.title}" has been removed from the feed.`);
  };

  const handleFavoriteToggle = useCallback((eventId, nextValue) => {
    if (!eventId) {
      return;
    }

    setSavedEventIds((current) => {
      const set = new Set(current);
      if (nextValue) {
        set.add(eventId);
      } else {
        set.delete(eventId);
      }
      return Array.from(set);
    });
  }, []);

  const dismissOrganizerToast = () => setOrganizerToast("");
  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const resetSearch = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };
  const handleCategoryChange = (event) => setSelectedCategory(event.target.value);
  const handleCategoryApply = () => {};
  const handleRetry = () => fetchEvents();

  return (
    <LayoutComponent
      navLinks={config.navLinks}
      roleLabel={config.roleLabel}
      logoSrc={config.logoSrc}
      profileIcon={config.profileIcon}
      onLogout={onLogout}
    >
      <div className="events-shell">
        <section className={`events-hero events-hero--${config.variant}`}>
          <h1 className="events-hero__title">{config.title}</h1>
          <p className="events-hero__subtitle">{config.subtitle}</p>

          <div className="events-toolbar">
            <div className="events-filter">
              <label htmlFor="events-category-input">Category</label>
              <div className="events-filter__field">
                <select
                  id="events-category-input"
                  aria-label="Select category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleCategoryApply}>
                  Apply
                </button>
              </div>
            </div>
            <div className="events-search">
              <label className="events-search__label" htmlFor="events-search-input">
                Search
              </label>
              <div className="events-search__field">
                <input
                  id="events-search-input"
                  type="search"
                  placeholder="Search events by title, category, or keywords"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="events-section">
          <h2 className="events-section__title">{config.eventsHeading}</h2>

          {isOrganizer && organizerToast && (
            <div className="events-toast" role="status">
              <span>{organizerToast}</span>
              <button type="button" onClick={dismissOrganizerToast} aria-label="Dismiss organizer notification">
                A-
              </button>
            </div>
          )}

          {loading ? (
            <div className="events-empty">
              <h3>Loading events...</h3>
              <p>Hang tight while we load the latest community opportunities.</p>
            </div>
          ) : error ? (
            <div className="events-empty">
              <h3>We could not load events</h3>
              <p>{error}</p>
              <button type="button" className="events-empty__reset" onClick={handleRetry}>
                Try again
              </button>
            </div>
          ) : hasResults ? (
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const ownsEvent = Boolean(userId && event.ownerId === userId);
                return (
                  <article key={event.id} className="events-grid__item">
                    <EventCard
                      event={event}
                      showFavorite={config.showFavorites}
                      onToggleFavorite={config.showFavorites ? handleFavoriteToggle : undefined}
                    />
                    {isOrganizer && (
                      <>
                        <div className="events-card-meta">
                          {ownsEvent ? (
                            <span className="events-card-ownership">Your event</span>
                          ) : (
                            <span className="events-card-ownership events-card-ownership--muted">
                              External event
                            </span>
                          )}
                        </div>
                        {ownsEvent && (
                          <div className="events-card-actions">
                            <button
                              type="button"
                              className="events-card-actions__btn"
                              onClick={() => handleOrganizerEdit(event)}
                            >
                              Edit Event
                            </button>
                            <button
                              type="button"
                              className="events-card-actions__btn events-card-actions__btn--danger"
                              onClick={() => handleOrganizerDelete(event)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="events-empty">
              <h3>No events found</h3>
              {searchQuery && (
                <p>
                  Nothing matches "<strong>{searchQuery}</strong>". Try a different term or clear your search.
                </p>
              )}
              <button type="button" className="events-empty__reset" onClick={resetSearch}>
                Clear search
              </button>
            </div>
          )}
        </section>
      </div>

      {config.showCreateButton && (
        <Link to="/events/create" className="events-floating-cta">
          {config.createButtonLabel ?? "Create Event"}
        </Link>
      )}
    </LayoutComponent>
  );
}
