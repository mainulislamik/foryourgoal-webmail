# ForYourGoal Webmail (Next.js TSX + Material UI)

Modern, enterprise-grade Google Workspace / Gmail replica webmail application built with **Next.js 15 (App Router, TypeScript TSX)** and **Material UI (MUI v6)** for `foryourgoal.com`.

## 🚀 Key Features

- **Google Workspace / Gmail Design Parity**:
  - Google Workspace Top Header with search bar, search filter button, Google Apps waffle grid, support, settings, and circular account avatar.
  - Left navigation rail with floating pill "Compose" button, unread count badges, and storage quota indicator.
  - Category Tabs (Primary, Promotions, Social, Updates).
  - Clean Mail List with multi-select checkboxes, star toggles, snippet formatting, and on-hover quick actions (Archive, Delete, Mark read/unread, Snooze).
  - Single-pane email reading view with circular back navigation (`←`), Google Sans subject header, sender profile card, safe HTML rendering, and bottom Reply/Forward pills.
  - Docked floating bottom-right compose card with minimize, expand, chip recipient input, rich text area, and Material Blue Send pill.
  - Profile & Avatar Settings: Direct custom profile picture upload with instant preview.
- **Backend & Network Architecture**:
  - Direct IMAP integration via `imapflow` to Dovecot SSL (`port 993`).
  - Direct SMTP sending via `nodemailer` to Postfix STARTTLS (`port 587`) with DKIM signing.
  - MIME email parsing via `mailparser` (`simpleParser`).
  - Stateless encrypted session credentials in `httpOnly` secure cookies via `jose` JWE.
  - Dockerized container reverse-proxied by Caddy with HTTP/2 and Let's Encrypt TLS at `https://mail.foryourgoal.com`.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **UI Library**: Material UI (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- **Email Protocol**: `imapflow` (IMAP), `nodemailer` (SMTP), `mailparser` (RFC822/MIME)
- **Authentication**: `jose` (JWE compact encrypted session tokens)
- **Deployment**: Docker & Docker Compose behind Caddy Reverse Proxy
