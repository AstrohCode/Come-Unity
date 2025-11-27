# Sprint 5 – Final Integration Plan

This sprint focuses on turning the current UI + API into a complete, role-aware MVP that satisfies the remaining FRs (especially dashboards, RSVP, saved events, and organizer/admin workflows).

**Setup (if we have time for Stories 5–6)**
- 1) Backend env updates (`mern-stack/.env`)
    - Look at the .env.example to see format.
    - `RESEND_API_KEY` — API key from the Resend dashboard (used to send RSVP/notification emails for Story 5).  
    - `CLOUDINARY_URL` — the Cloudinary API environment variable 
  - Do not commit the real values; each teammate should set their own local `.env` from the shared credentials.

- 2) Backend deps
  - From `mern-stack/`, run `npm install` to pick up all backend dependencies (`resend` and `cloudinary`)

**Stories and Subtasks (Outline)**
Story CU-7: Volunteer RSVP & Saved Events
- CU-67) RSVP data model + backend endpoints (Aric)
- CU-68) Wire RSVP actions on Event Details (Jonathan)
- CU-69) Volunteer dashboard – use real data (Jonathan)
- CU-88) Saved events persistence (Aric)

Story CU-8: Organizer Event Management & Dashboard
- CU-70) Organizer “my events” API (Aric)
- CU-71) Organizer dashboard – real data (Selena)
- CU-72) Edit / delete event APIs (Selena)
- CU-89) Edit event flow (frontend) (Selena)

Story CU-9: Admin Pending Queue & Moderation
- CU-73) Pending events list API (Aric)
- CU-74) Admin dashboard – live data (Manmeet)
- CU-75) Approve/deny integration from dashboard (Selena)

Story CU-10: UX & Reliability Polish (Events + Auth)
- CU-76) Capacity + status display (Manmeet)
- CU-77) Event images strategy (MVP) (Manmeet)
- CU-78) Input validation & error consistency (Jonathan)
- CU-79) Logout + session edge cases (Jonathan)
- CU-90) Events nav routing polish (Manmeet)

Story CU-80: Notifications & Reminders (stretch)
- CU-82) Volunteer RSVP confirmation email (Aric)
- CU-83) Volunteer 24-hour reminder email (Aric)
- CU-84) Organizer new-signup notification email (Aric)

Story CU-81: Cloud-hosted Event Images with Cloudinary (stretch / if time)
- CU-85) Backend upload endpoint / signed URLs (Aric)
- CU-86) Wire Create Event form to Cloudinary (Aric)
- CU-87) Migration / coexistence plan (Aric)

**By Person (Subtasks)**
- Aric  
  - CU-67) RSVP data model + backend endpoints  
  - CU-88) Saved events persistence  
  - CU-70) Organizer “my events” API  
  - CU-73) Pending events list API  
  - CU-82) Volunteer RSVP confirmation email  
  - CU-83) Volunteer 24-hour reminder email  
  - CU-84) Organizer new-signup notification email  
  - CU-85) Backend upload endpoint / signed URLs  
  - CU-86) Wire Create Event form to Cloudinary  
  - CU-87) Migration / coexistence plan  

- Jonathan  
  - CU-68) Wire RSVP actions on Event Details  
  - CU-69) Volunteer dashboard – use real data  
  - CU-78) Input validation & error consistency  
  - CU-79) Logout + session edge cases  

- Selena  
  - CU-71) Organizer dashboard – real data  
  - CU-72) Edit / delete event APIs  
  - CU-89) Edit event flow (frontend)  
  - CU-75) Approve/deny integration from dashboard  

- Manmeet  
  - CU-74) Admin dashboard – live data  
  - CU-76) Capacity + status display  
  - CU-77) Event images strategy (MVP)  
  - CU-90) Events nav routing polish  

## Story CU-7: Volunteer RSVP & Saved Events

- CU-67) RSVP data model + backend endpoints  
  - Backend: add a dedicated RSVP/registration model (e.g., `backend/models/Registration.js`) that links a volunteer user to an event with optional `hoursCommitted` and timestamps.  
  - Shape suggestion: `{ user: ObjectId(User), event: ObjectId(Event), hoursCommitted: Number, createdAt, updatedAt }` with a unique compound index on `{ user, event }` to prevent duplicates.  
  - Add endpoints such as:
    - `POST /api/events/:id/rsvp` — authenticated + `requireRole("volunteer")`; create a registration for the current user and the given event id (or update `hoursCommitted` if you choose to upsert).  
    - `DELETE /api/events/:id/rsvp` — authenticated + `requireRole("volunteer")`; remove the registration for the current user and event.  
  - In `POST`, enforce capacity by comparing the count of registrations for the event against `event.capacity` (if defined). If full, return a 400 with `{ error: { message: "Event is full" } }`.  
  - Responses should follow the existing pattern: on success, return a JSON body such as `{ registration }` or `{ message: "...", registration }`; on error, always return `{ error: { message } }`.  
  - Keep logic in a new routes file (e.g., `backend/routes/registrations.js`) or hang these routes off `backend/routes/events.js` under `/api/events/:id/rsvp` for simplicity.

- CU-68) Wire RSVP actions on Event Details  
  - Open `frontend/src/pages/Events/EventDetails.jsx` and locate the volunteer RSVP UI and state (`signedUp`, `selectedHours`, `handleSignupToggle`, etc.). Right now, these update local state only.  
  - Replace the current toggle logic so that:
    - When a volunteer selects hours and clicks “Sign up”, call `api.post("/api/events/" + id + "/rsvp", { hoursCommitted })` where `id` is from `useParams()` and `hoursCommitted` is derived from `selectedHours`.  
    - When they click “Cancel RSVP”, call `api.delete("/api/events/" + id + "/rsvp")`.  
  - On success:
    - Set `signedUp` to `true`/`false` accordingly.  
    - Optionally store the returned registration (or at least `hoursCommitted`) in local state so the UI can reflect the committed hours.  
    - If the event response includes updated slot counts, update the `event` state so the “X/Y volunteers signed up” text stays accurate.  
  - On errors:
    - If the backend responds with “Event is full”, show a clear inline message near the RSVP button.  
    - For generic failures (network, auth), show a friendly error message (similar tone to existing error copy) and allow the user to try again.  
  - Keep the non-volunteer roles unchanged: only volunteers should see/trigger the RSVP actions.

- CU-69) Volunteer dashboard – use real data  
  - Open `frontend/src/pages/Volunteer/VolunteerDashboard.jsx`. It currently uses `mockDashboardPayload` and a `setTimeout` to simulate loading.  
  - Add a new backend endpoint (in coordination with 1.1) such as `GET /api/volunteer/dashboard` that returns a payload shaped like:  
    - `metrics: { hoursCommitted, totalHours }` (or similar)  
    - `upcomingEvents: [ { id, title, category, description, imageUrl, date, startTime, ... } ]`  
    - `pastEvents: [ ...same shape... ]`  
  - Replace the `setTimeout` mock with a real `api.get("/api/volunteer/dashboard")` call in a `useEffect`, setting `dashboardData` and `loading` based on the response.  
  - Use RSVP records to calculate metrics on the backend where possible, so the frontend mostly trusts `metrics` from the API (only derive counts like `upcomingEvents.length` client-side).  
  - Keep the existing loading skeletons and empty states; only swap their data source.  
  - Preserve the role guard: the component should still redirect any non-volunteer user to `/events` (as it does now with `Navigate`).

- CU-88) Saved events persistence  
  - Backend: add simple save/unsave endpoints, e.g., in `backend/routes/events.js` or a new file:  
    - `POST /api/events/:id/save` — authenticated + `requireRole("volunteer")`; record that the current user has saved this event.  
    - `DELETE /api/events/:id/save` — authenticated + `requireRole("volunteer")`; remove the saved record.  
  - You can either:
    - Add a `savedEvents` array field to the `User` model (list of event ObjectIds), or  
    - Create a small `SavedEvent` model linking `{ user, event }` similar to RSVP.  
  - Add a `GET /api/events/saved` endpoint to return the list of saved events for the current user, formatted like the events list API (so `EventCard` and `SavedEventsPage` can reuse mapping logic).  
  - Frontend:
    - In `EventCard.jsx`, wire the heart button so that toggling it calls the appropriate save/unsave endpoint (only when `showFavorite` is true). Keep the local `saved` state in sync with the server response.  
    - In `frontend/src/pages/Events/SavedEventsPage.jsx`, replace the `mockSavedEvents` array and `setTimeout` with a real `api.get("/api/events/saved")` call, setting `events` and `loading` based on the response.  
    - Ensure the “Remove bookmark” button calls the unsave endpoint and updates local state so the UI responds immediately.

## Story CU-8: Organizer Event Management & Dashboard

- CU-70) Organizer “my events” API  
  - Backend: add an organizer-scoped endpoint such as `GET /api/organizer/events` that returns only events where `owner` is the current user (`req.user.id`).  
  - The handler should use `auth` + `requireRole("organizer")` and query the `Event` model for `{ owner: req.user.id }`, optionally filtering to upcoming events by date.  
  - Response shape can be `{ events: [ { id, title, date, startTime, status, capacity, ... } ], metrics: { upcomingEvents, totalVolunteers, eventsCreated } }` to match what the organizer dashboard needs.  
  - For metrics:
    - `upcomingEvents`: count of events with a date in the future.  
    - `eventsCreated`: total number of events the organizer has created.  
    - `totalVolunteers`: initially, you can approximate based on RSVP counts once RSVP data exists, or stub and refine later.  
  - Keep error handling consistent: 500 on server errors with `{ error: { message: "Server error" } }`.

- CU-71) Organizer dashboard – real data  
  - Open `frontend/src/pages/Organizer/OrganizerDashboard.jsx`. It currently uses `mockOrganizerPayload` and a `setTimeout` to populate `dashboardData`.  
  - Replace the mock `load` logic with a real `api.get("/api/organizer/events")` call inside a `useEffect`, setting `dashboardData` from `res.metrics` and `res.events`.  
  - Ensure the metrics summary cards read from the API response (or fall back to simple computed values from `events` if needed).  
  - Continue to use the existing loading skeletons and toasts; they should now reflect real organizer events instead of hard-coded ones.  
  - Keep the existing role guard: if the logged-in user is not an organizer, redirect them to `/events`.

- CU-72) Edit / delete event APIs  
  - Backend: extend `backend/routes/events.js` (or a dedicated file) with:
    - `PATCH /api/events/:id` — `auth` + either `requireRole("organizer")` or a custom check that allows the owner or admin to edit. Load the event, verify that `event.owner` matches `req.user.id` or `req.user.role === "admin"`, then apply allowed updates (title, description, category, date, times, address, capacity, imageUrl).  
    - `DELETE /api/events/:id` — same auth/ownership checks, then remove or soft-delete the event.  
  - For edits triggered by organizers:
    - After a successful update, set `event.status = "pending"` so the event re-enters the admin approval queue.  
    - For admin edits (if you support them), decide whether status remains unchanged or also cycles through pending.  
  - Make sure responses include the updated event (`{ event }`) and use the consistent error shape on failures (404 if not found, 403 if not owner/admin).

- CU-89) Edit event flow (frontend)  
  - Wire the existing “Edit Event” placeholders in `EventDetails.jsx` and `OrganizerDashboard.jsx` to a real edit flow:
    - Decide on an edit route (e.g., `/events/:id/edit`) that uses the same underlying form as `CreateEventPage.jsx`, but in “edit mode”.  
    - Ensure that navigating to this route loads the current event data (`GET /api/events/:id`) and pre-populates the form fields.  
  - In the form:
    - On submit, call `PATCH /api/events/:id` instead of `POST /api/events`.  
    - Show success and error messages similar to the create flow, and redirect back to Event Details or the organizer dashboard on success.  
  - For delete:
    - Keep the existing delete confirmation UX in `EventDetails.jsx` and `OrganizerDashboard.jsx`, but have the final “Delete” action call `DELETE /api/events/:id` and then navigate away (e.g., back to `/events` or the organizer dashboard) and show a one-off toast.  
  - Reuse as much of the existing Create Event validation and layout as possible to keep the experience consistent.

## Story CU-9: Admin Pending Queue & Moderation

- CU-73) Pending events list API  
  - Backend: add an admin-only endpoint such as `GET /api/admin/events/pending` that returns all events with `status: "pending"`.  
  - Use `auth` + `requireRole("admin")` and query the `Event` model for `status: "pending"`, optionally limiting or paginating the results.  
  - Return fields needed by the admin dashboard: `id`, `title`, `category`, `owner` or organizer name/email, `submittedAt` (e.g., `createdAt`), and current `status`.  
  - Keep error and success shapes consistent with other admin routes.

- CU-74) Admin dashboard – live data  
  - Open `frontend/src/pages/Admin/AdminDashboard.jsx`. It currently uses `mockPendingEvents` and a `setTimeout` to simulate load.  
  - Replace the mock loader with an `api.get("/api/admin/events/pending")` call, setting `events` and `loading` from the response.  
  - Make the summary tiles (`pending`, `approved`, `denied`) derive from real event data:
    - After an approve/deny action, update local state so the counts and lists reflect the new statuses without a page refresh.  
  - Preserve the existing loading skeletons, empty state (“All caught up!”), and “Load more” pagination—they should now operate on real pending events.  
  - Keep the role guard so only admins can see this dashboard; others should be redirected to `/events`.

- CU-75) Approve/deny integration from dashboard  
  - In `AdminDashboard.jsx`, the approve/deny buttons currently update local state only.  
  - Replace these handlers so that clicking “Approve” calls `api.post("/api/admin/events/" + id + "/approve")` and “Deny” calls `api.post("/api/admin/events/" + id + "/deny")`.  
  - On success:
    - Update the relevant event in local state with the returned event’s status.  
    - Ensure that pending lists and summary counts update accordingly (e.g., approved events leave the pending list and increment the “Approved Today” count).  
  - On error:
    - Log the error and show a simple inline message near the buttons or at the top of the dashboard (e.g., “We couldn’t update this event. Please try again.”).  
  - Make sure the interactions remain responsive (disable buttons while the API call is in flight).

## Story CU-10: UX & Reliability Polish (Events + Auth)

- CU-76) Capacity + status display  
  - Decide on a single, consistent way to represent capacity and fill status across the UI:
    - On `EventCard`, use `slotsAvailable` / `slotsTotal` (or derived from capacity and RSVP count) to show “X/Y volunteers”.  
    - On `EventDetails`, reuse the same numbers so the badge and highlights match the card.  
  - Ensure that when the RSVP endpoint indicates an event is full, both `EventCard` and `EventDetails` clearly reflect that state:
    - Visually mark full events (e.g., “Full” chip or disabled styling).  
    - Disable RSVP actions when capacity is reached, and show a short explanation instead of letting the user attempt to sign up.

- CU-77) Event images strategy (MVP)  
  - Use the category-specific images already in `frontend/src/assets` as defaults:
    - `health-default.png` for “Health” events.  
    - `education-default.jpg` for “Education” events.  
    - `family-default.jpg` for “Family” events.  
    - `cultural-default.jpg` for “Cultural” events.  
    - `volunteer-default.png` for “Volunteer” events (and as a generic fallback).  
  - In `EventCard.jsx` and `EventDetails.jsx`, when `event.imageUrl` is missing, blank, or fails to load:
    - Map `event.category` to the appropriate default image above, and fall back to `volunteer-default.png` if the category is unknown.  
  - Add an `onError` handler to `<img>` tags that swaps in the mapped default image if the provided URL 404s or fails, so broken links never show a broken image icon.  
  - Ensure the Create Event form still passes through `imageUrl` when provided, but that cards/details always render a valid image by using these defaults when needed.

- CU-78) Input validation & error consistency  
  - Audit key backend routes (`auth/register`, `auth/login`, `events` create/edit, RSVP endpoints) and ensure they validate inputs robustly:
    - Check for required fields, reasonable lengths, and basic formats (e.g., email shape, non-empty strings).  
  - For events:
    - In addition to the existing frontend time checks, add a backend validation step that computes start and end minutes (using the same logic as `parseTimeToMinutes`) and rejects any payload where end time is not strictly after start time.  
    - Return a clear message like `{ error: { message: "End time must be after start time." } }` so the frontend can display it directly.  
  - Make sure all new and existing endpoints return errors in a consistent shape `{ error: { message } }` (never plain strings) so the frontend’s `api.js` helper can pick up and surface the messages uniformly.

- CU-79) Logout + session edge cases  
  - Double-check `App.jsx` and `ProtectedRoute`:
    - Make sure hitting “Log out” in the events nav profile menu clears `localStorage.user`, updates React state, and redirects back to `/`.  
    - Confirm that any protected route (`/events`, dashboards, etc.) sends unauthenticated users back to the login screen.  
  - Add defensive parsing to the storage helper so if `localStorage.user` is corrupted (invalid JSON), the app logs an error (if desired), clears that value, and treats the user as logged out instead of crashing.  
  - Test cross-tab behaviour: logging out in one tab should trigger the `storage` event and update auth state in other open tabs.

- CU-90) Events nav routing polish  
  - Open `frontend/src/pages/Events/EventsNavBar.jsx`. The nav links currently use plain `<a href>` tags.  
  - Import `Link` or `NavLink` from `react-router-dom` and replace the anchors with `<Link to={link.href}>` (or `NavLink` with a function that adds the active class when `isActive` is true).  
  - Ensure that the active nav styling (`events-nav__link--active`) reflects the current URL even on hard refresh:
    - You can either rely on `NavLink`’s `isActive` or read the current location via `useLocation`.  
  - Keep the existing appearance by reusing the same classes; only adjust CSS if needed to account for `Link` vs `a` rendering.  
  - Verify that navigation between `/events`, `/events/saved`, and dashboard routes happens without full page reloads.

## Story CU-80: Notifications & Reminders (stretch)

- CU-82) Volunteer RSVP confirmation email  
  - After a successful RSVP, send a one-time email to the volunteer confirming their registration.  
  - Include event name, date/time, location, committed hours (if provided), and a link back to the Event Details page.

- CU-83) Volunteer 24-hour reminder email  
  - Once per event RSVP, send a reminder email roughly 24 hours before the event start time.  
  - Include event name, date/time, location, and simple copy encouraging them to attend or cancel in the app if plans change.

- CU-84) Organizer new-signup notification email  
  - When a volunteer RSVPs to an event, send a short notification email to that event’s organizer.  
  - Include the volunteer’s name (where available), event name/date, and a brief “new volunteer registered” message.

## Story CU-81: Cloud-hosted Event Images with Cloudinary (stretch / if time)

- CU-85) Backend upload endpoint / signed URLs  
  - Add a backend endpoint to either accept image uploads and forward them to Cloudinary or to return signed upload URLs for direct browser uploads.  
  - Validate file type/size and return the final public image URL to be stored on the Event document.

- CU-86) Wire Create Event form to Cloudinary  
  - Update `CreateEventPage.jsx` to upload selected images to Cloudinary before submitting the event payload.  
  - On success, include the returned Cloudinary URL as `imageUrl` so cards and details use the hosted image; fall back to the category-based default image when no upload is provided.

- CU-87) Migration / coexistence plan  
  - Decide how to treat existing events that still reference local/placeholder images (e.g., mix of category defaults and Cloudinary URLs).  
  - Keep the category-based default image strategy from Story 4.4 as a safe fallback even after Cloudinary is wired in.
