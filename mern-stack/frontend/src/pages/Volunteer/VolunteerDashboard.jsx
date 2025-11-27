import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import VolunteerLayout from "@/pages/Events/layouts/VolunteerLayout";
import EventCard from "@/pages/Events/EventCard";
import logoClear from "@/assets/Logo (clear).png";
import profileBadge from "@/assets/6 1.png";
import calendarIcon from "@/assets/Calender image.png";
import favoriteIcon from "@/assets/Favorite.png";
import dashboardIcon from "@/assets/dashboard.png";
import selfCareImage from "@/assets/self care image 1.png";
import nutritionImage from "@/assets/Untitled design 1.png";
import foodBankImage from "@/assets/volunteer-default.png";
import libraryImage from "@/assets/3 7.png";
import diversityImage from "@/assets/5 6.png";
import "./volunteer-dashboard.css";

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

const mockDashboardPayload = {
  metrics: {
    hoursCommitted: 6,
    totalHours: 124,
  },
  upcomingEvents: [
    {
      id: "evt-301",
      title: "Oak Park Garden Refresh",
      category: "Volunteer",
      description:
        "Join the neighborhood team to prep the pollinator beds before spring.",
      imageUrl: selfCareImage,
      slotsAvailable: 4,
      slotsTotal: 20,
    },
    {
      id: "evt-302",
      title: "Wellness Kits Assembly Night",
      category: "Health",
      description:
        "Pack hygiene kits for shelter guests. Supplies and snacks provided.",
      imageUrl: nutritionImage,
      slotsAvailable: 7,
      slotsTotal: 30,
    },
    {
      id: "evt-303",
      title: "River District Food Distribution",
      category: "Community",
      description:
        "Distribute fresh produce and pantry staples at the mobile market.",
      imageUrl: foodBankImage,
      slotsAvailable: 2,
      slotsTotal: 25,
    },
  ],
  pastEvents: [
    {
      id: "evt-280",
      title: "Central Library Storytime",
      category: "Education",
      description:
        "Help host an inclusive story hour with crafts for early readers.",
      imageUrl: libraryImage,
      slotsAvailable: 0,
      slotsTotal: 18,
    },
    {
      id: "evt-261",
      title: "Voices in Color Showcase",
      category: "Cultural",
      description:
        "Supported artists backstage and welcomed guests at the gallery night.",
      imageUrl: diversityImage,
      slotsAvailable: 0,
      slotsTotal: 40,
    },
  ],
};

export default function VolunteerDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: null,
    upcomingEvents: [],
    pastEvents: [],
  });

  const navLinks = useMemo(
    () =>
      volunteerNavLinks.map((link) =>
        link.href === "/dashboard/volunteer"
          ? { ...link, active: true }
          : { ...link, active: false }
      ),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDashboardData(mockDashboardPayload);
      setLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const shouldRedirect =
    typeof user?.role === "string" && user.role !== "volunteer";

  const metrics = useMemo(() => {
    const base = dashboardData.metrics ?? {};
    const upcomingCount = dashboardData.upcomingEvents.length;
    return {
      upcoming: upcomingCount,
      hoursCommitted: base.hoursCommitted ?? 0,
      totalHours: base.totalHours ?? 0,
    };
  }, [dashboardData.metrics, dashboardData.upcomingEvents]);

  const metricCards = [
    {
      label: "Upcoming Events",
      value: metrics.upcoming,
      helper: "Events currently on your schedule",
    },
    {
      label: "Hours Committed",
      value: metrics.hoursCommitted,
      helper: "Hours scheduled for upcoming events",
    },
    {
      label: "Total Hours Volunteered",
      value: metrics.totalHours,
      helper: "All time",
    },
  ];

  const hasUpcoming = dashboardData.upcomingEvents.length > 0;
  const hasPast = dashboardData.pastEvents.length > 0;

  if (shouldRedirect) {
    return <Navigate to="/events" replace />;
  }

  return (
    <VolunteerLayout
      navLinks={navLinks}
      roleLabel="Volunteer"
      logoSrc={logoClear}
      profileIcon={profileBadge}
      onLogout={onLogout}
    >
      <div className="volunteer-dashboard">
        <header className="volunteer-dashboard__header">
          <div>
            <p className="volunteer-dashboard__eyebrow">Your impact overview</p>
            <h1>Volunteer Dashboard</h1>
            <p>Track upcoming commitments, hours logged, and recent highlights.</p>
          </div>
          <div className="volunteer-dashboard__status-chip">
            {loading ? "Syncing schedule" : "Everything is up to date"}
          </div>
        </header>

        <section className="volunteer-dashboard__metrics" aria-live="polite">
          {metricCards.map((metric) => (
            <article
              key={metric.label}
              className={`volunteer-dashboard__metric${
                loading ? " volunteer-dashboard__metric--loading" : ""
              }`}
            >
              {loading ? (
                <>
                  <span className="volunteer-dashboard__skeleton volunteer-dashboard__skeleton--label" />
                  <span className="volunteer-dashboard__skeleton volunteer-dashboard__skeleton--value" />
                  <span className="volunteer-dashboard__skeleton volunteer-dashboard__skeleton--helper" />
                </>
              ) : (
                <>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.helper}</small>
                </>
              )}
            </article>
          ))}
        </section>

        <section className="volunteer-dashboard__section">
          <div className="volunteer-dashboard__section-header">
            <div>
              <p>Upcoming commitments</p>
              <h2>Next on your calendar</h2>
            </div>
            {!loading && (
              <span className="volunteer-dashboard__pill">
                {metrics.upcoming} {metrics.upcoming === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="volunteer-dashboard__card-grid volunteer-dashboard__card-grid--skeleton">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="volunteer-dashboard__card-skeleton" />
              ))}
            </div>
          ) : hasUpcoming ? (
            <div className="volunteer-dashboard__card-grid">
              {dashboardData.upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="volunteer-dashboard__empty">
              <h3>No upcoming events</h3>
              <p>Find a new opportunity in the Events feed and add it to your list.</p>
              <a className="volunteer-dashboard__cta" href="/events">
                Browse events
              </a>
            </div>
          )}
        </section>

        <section className="volunteer-dashboard__section">
          <div className="volunteer-dashboard__section-header">
            <div>
              <p>Past highlights</p>
              <h2>Recently completed</h2>
            </div>
          </div>

          {loading ? (
            <div className="volunteer-dashboard__card-grid volunteer-dashboard__card-grid--skeleton">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="volunteer-dashboard__card-skeleton" />
              ))}
            </div>
          ) : hasPast ? (
            <div className="volunteer-dashboard__card-grid">
              {dashboardData.pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="volunteer-dashboard__empty">
              <h3>No past events yet</h3>
              <p>Your completed volunteer experiences will show up here.</p>
            </div>
          )}
        </section>
      </div>
    </VolunteerLayout>
  );
}
