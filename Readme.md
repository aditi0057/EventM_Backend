# EventM Backend

This is the backend API for EventM, a full-stack corporate event management platform. The backend handles authentication, users, events, polls, gallery uploads, image moderation, calendars, notifications, announcements, dashboard data, and admin operations.

The frontend application is located in:

```text
../Event_M
```

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- Cookie-based sessions
- Multer for file uploads
- Cloudinary for image storage
- Nodemon for local development

## Features

- User registration, login, logout, token refresh, and current-user lookup
- Email verification, forgot password, and reset password endpoints
- JWT access and refresh token generation
- Role-based access control for admin-only actions
- Event CRUD, RSVP tracking, and upcoming celebration lookup
- Poll CRUD, voting, result lookup, and poll closing
- Gallery upload, albums, image listing, approval, rejection, and deletion
- Personal and company calendar endpoints
- User and admin dashboard data
- Notification listing and read-state updates
- Announcement creation, listing, and deletion
- Admin user management, app settings, gallery moderation, and statistics
- Centralized error handling and API response helpers

## Folder Structure

```text
EventM_Backend/
|-- public/
|   |-- temp/             # Temporary upload files
|   `-- uploads/          # Local uploaded assets
|-- src/
|   |-- controllers/      # Route handlers and business logic
|   |-- db/               # MongoDB connection
|   |-- middlewares/      # Auth, role, admin, and upload middleware
|   |-- models/           # Mongoose models
|   |-- routes/           # Express route definitions
|   |-- utils/            # API helpers, Cloudinary, notifications
|   |-- app.js            # Express app setup and server startup
|   `-- constants.js      # Shared constants
|-- .env.sample           # Example environment variables
|-- package.json
`-- package-lock.json
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Cloudinary account for gallery image uploads

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the backend root. You can copy from `.env.sample`:

```bash
cp .env.sample .env
```

Configure these values:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

REQUIRE_EMAIL_VERIFICATION=false
NODE_ENV=development
```

Important: `src/db/index.js` appends the database name from `src/constants.js` to `MONGODB_URI`. Use a base MongoDB URI that can accept the database path.

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
```

## Run Locally

Start the backend development server:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:8000
```

Start the production server:

```bash
npm run start
```

## Available Scripts

```bash
npm run dev      # Start server with nodemon and dotenv
npm run start    # Start server with node and dotenv
```

## API Base Paths

The app exposes versioned and compatibility routes.

Primary versioned API:

```text
/api/v1/users
/api/v1/events
/api/v1/polls
/api/v1/gallery
/api/v1/calendar
/api/v1/dashboard
/api/v1/admin
/api/v1/notifications
/api/v1/announcements
```

Compatibility API paths:

```text
/api/auth
/api/users
/api/events
/api/polls
/api/gallery
/api/admin
/api/notifications
/api/announcements
```

## Main Endpoints

### Users and Auth

```text
POST   /api/v1/users/register
POST   /api/v1/users/login
POST   /api/v1/users/logout
POST   /api/v1/users/verify-email
POST   /api/v1/users/forgot-password
POST   /api/v1/users/reset-password
POST   /api/v1/users/refresh-token
GET    /api/v1/users/current-user
GET    /api/v1/users/birthdays
GET    /api/v1/users/anniversaries
GET    /api/v1/users/settings
POST   /api/v1/users/settings
POST   /api/v1/users/change-password
PATCH  /api/v1/users/update-account
PATCH  /api/v1/users/avatar
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

### Events

```text
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/celebrating-soon
GET    /api/v1/events/:eventId
PUT    /api/v1/events/:eventId
PATCH  /api/v1/events/:eventId
DELETE /api/v1/events/:eventId
GET    /api/v1/events/:eventId/rsvp
POST   /api/v1/events/:eventId/rsvp
```

### Polls

```text
GET    /api/v1/polls
POST   /api/v1/polls
POST   /api/v1/polls/:pollId/vote
PATCH  /api/v1/polls/:pollId/vote
GET    /api/v1/polls/:pollId/results
PATCH  /api/v1/polls/:pollId/close
PATCH  /api/v1/polls/:pollId
DELETE /api/v1/polls/:pollId
```

### Gallery

```text
GET    /api/v1/gallery
POST   /api/v1/gallery
POST   /api/v1/gallery/upload
GET    /api/v1/gallery/albums
POST   /api/v1/gallery/albums
GET    /api/v1/gallery/event/:eventId
GET    /api/v1/gallery/user/:userId
GET    /api/v1/gallery/pending
POST   /api/v1/gallery/approve-all
DELETE /api/v1/gallery/:imageId
PATCH  /api/v1/gallery/:imageId/approve
PATCH  /api/v1/gallery/:imageId/reject
DELETE /api/v1/gallery/:imageId/reject
```

### Calendar

```text
GET /api/v1/calendar/personal
GET /api/v1/calendar/company
```

### Dashboard and Admin

```text
GET    /api/v1/dashboard/user
GET    /api/v1/dashboard/admin
GET    /api/v1/admin/stats
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id/activity
PATCH  /api/v1/admin/users/:id/role
PATCH  /api/v1/admin/users/:id/status
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/settings
POST   /api/v1/admin/settings
GET    /api/v1/admin/gallery/pending
POST   /api/v1/admin/gallery/approve-all
PATCH  /api/v1/admin/gallery/:imageId/approve
PATCH  /api/v1/admin/gallery/:imageId/reject
```

### Notifications

```text
GET   /api/v1/notifications
GET   /api/v1/notifications/unread-count
PATCH /api/v1/notifications/mark-all-read
PATCH /api/v1/notifications/read-all
PATCH /api/v1/notifications/:id/read
```

### Announcements

```text
GET    /api/v1/announcements
POST   /api/v1/announcements
DELETE /api/v1/announcements/:id
```

## Authentication

Protected routes use the `verifyJWT` middleware. The backend reads the JWT from cookies and validates it with `ACCESS_TOKEN_SECRET`.

Admin-only routes use role authorization through `authorizeRoles("admin")`.

For local development, the frontend should call the API with credentials included. The existing frontend API client does this through `credentials: "include"`.

## File Uploads

Gallery and avatar uploads use `multer`. Gallery image uploads accept either `image` or `file` as the form-data field name.

Cloudinary credentials are required for production image storage.

## Frontend Integration

In the frontend `.env.local`, set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

In the backend `.env`, set:

```env
CORS_ORIGIN=http://localhost:3000
```

Then run both apps:

```bash
# Terminal 1
cd EventM_Backend
npm run dev

# Terminal 2
cd Event_M
npm run dev
```

## Deployment Notes

- Use strong JWT secrets in production.
- Set `NODE_ENV=production` for secure production cookie behavior.
- Set `CORS_ORIGIN` to the deployed frontend URL.
- Set frontend `NEXT_PUBLIC_API_URL` to the deployed backend API URL.
- Keep `.env`, uploaded files, temporary files, and credentials out of version control.
- Ensure MongoDB and Cloudinary credentials are configured before deploying gallery features.
