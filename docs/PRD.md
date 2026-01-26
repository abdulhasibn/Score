# Product Requirements Document (PRD)
## Cricket Tournament Management SaaS (Web-first MVP)

---

## 1. Overview

### 1.1 Product Name
(Working title) Cricket Tournament Management Platform

### 1.2 Objective
Build a scalable, web-first SaaS platform to manage **corporate and local cricket tournaments** in India, covering organization management, players as persistent entities, tournaments, matches, and live ball-by-ball scoring.

The MVP focuses on **organizations (corporates/clubs)**, with future expansion to **open local teams and community tournaments**.

---

## 2. Problem Statement

Grassroots and corporate cricket tournaments are commonly managed using:
- Paper score sheets
- WhatsApp groups
- Excel / Google Sheets
- Mobile-first scoring apps with poor admin workflows

These approaches fail to provide:
- Centralized tournament control
- Persistent player identities
- Clean role separation (admin, scorer, player)
- Reliable live scoring on web
- Scalable data ownership for organizations

---

## 3. Target Users

### 3.1 Organization Admin
- Creates and manages organizations
- Creates tournaments and teams
- Assigns roles (scorer, captain)
- Oversees all matches and data

### 3.2 Team Manager / Captain
- Manages team roster
- Assigns playing XI
- Coordinates match readiness

### 3.3 Scorer
- Inputs ball-by-ball match data
- Responsible for live scoring accuracy

### 3.4 Player
- Has a persistent profile
- Views personal and team stats
- Can belong to multiple organizations

### 3.5 Viewer (Read-only)
- Views live scores, results, and standings
- No authentication required (public access)

---

## 4. Key Product Principles

- Web-first (desktop + mobile browser)
- Multi-tenant SaaS (organization-based)
- Player as a **global entity**
- Event-driven scoring (ball-by-ball)
- Clean separation of concerns
- Designed for future mobile apps
- Zero infra cost during development phase

---

## 5. MVP Scope (Phase 1)

### 5.1 Organization Management
- Create organization
- Invite users
- Assign roles (admin, scorer, player)

### 5.2 Player Management
- Global player profiles
- Unique identifier (email / phone)
- Map players to organizations
- Player can exist in multiple orgs

### 5.3 Tournament Management
- Create tournaments under an organization
- Define format (T20, custom overs)
- Create teams
- Assign players to teams
- Generate or manually manage match fixtures

### 5.4 Match Management
- Create matches
- Assign teams, venue, schedule
- Match lifecycle:
  - Scheduled
  - Live
  - Completed

### 5.5 Live Scoring (Core MVP)
- Ball-by-ball scoring
- Track:
  - Runs
  - Wickets
  - Extras
  - Overs
- Auto-calculated totals
- Real-time updates for viewers

### 5.6 Viewing & Stats
- Live scorecard
- Match summary
- Points table
- Basic player stats

---

## 6. Out of Scope (MVP)

- Mobile apps (Android/iOS)
- Offline scoring
- Auctions / drafts
- Advanced analytics (wagon wheel, pitch map)
- Payments & subscriptions
- Video streaming
- Non-cricket sports

---

## 7. Future Scope (Post-MVP)

- Player auctions / drafts
- Advanced stats & analytics
- Organization branding / white-labeling
- Notifications
- Mobile apps (React Native)
- Public tournament discovery
- Sponsorship & ads

---

## 8. Functional Requirements

### 8.1 Authentication
- Email OTP or magic link (initial)
- Role-based access control
- Session-based auth

### 8.2 Authorization
- Org-level isolation
- Only authorized scorers can score matches
- Admin-only tournament controls

### 8.3 Data Integrity
- Event-based scoring model
- No direct aggregate manipulation
- Derived stats from ball events

---

## 9. Technical Architecture (High Level)

### 9.1 Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### 9.2 State Management
- TanStack Query for server state
- No direct DB access from UI

### 9.3 Backend
- Supabase
  - PostgreSQL
  - Auth
  - Realtime

### 9.4 Architecture Pattern
- Modular monolith
- Single repo for MVP
- Clear domain separation
- Designed for backend extraction later

---

## 10. Data Model (Conceptual)

- Organization
- User
- PlayerProfile (global)
- OrganizationPlayer (join)
- Tournament
- Team
- Match
- Inning
- BallEvent

---

## 11. Non-Functional Requirements

- Scalable to multiple concurrent matches
- Low-latency live updates
- Strong tenant isolation
- Maintainable by a single developer
- Clean upgrade path to paid infra

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|----|----|
| Scope creep | Strict MVP boundaries |
| Live scoring bugs | Event-based model |
| Performance issues | Realtime + caching |
| Overengineering | Modular monolith |

---

## 13. Success Metrics (MVP)

- Successful completion of a full tournament
- Accurate live scoring
- Multiple teams and matches handled
- Positive admin/scorer feedback
- No critical data loss

---

## 14. Open Questions

- Public vs private tournaments?
- Phone OTP vs email-only auth?
- Single vs multiple scorers per match?
- Match correction / undo rules?

(To be finalized during implementation)

---

## 15. Revision History

- v1.0 – Initial MVP PRD
