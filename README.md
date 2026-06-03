# Telegram Drive

A web-based file storage application using Telegram as the backend. Upload, manage, and share files via your Telegram account — similar to Google Drive but with Telegram as the storage provider.

## Features

- Upload files (up to 2GB) and organize them in virtual folders
- Grid/list view with file type icons
- Drag & drop uploads with progress bars
- In-browser preview for images, video, PDF, and text files
- Right-click context menu (rename, move, delete, share)
- Shareable download links with optional expiration
- Multiple Telegram account support
- Responsive design for desktop and mobile

## Prerequisites

- Node.js 18+ 
- Telegram API credentials from https://my.telegram.org

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Edit `server/.env` (created automatically with defaults). You can change:

```
PORT=3001
JWT_SECRET=your-secret-key-here
UPLOAD_DIR=./uploads
DATABASE_PATH=./data/database.sqlite
```

### 3. Run the app

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently.

Open http://localhost:5173 in your browser.

### 4. Connect your Telegram account

1. Open the app — you'll see the login/setup screen
2. Click "Add new account"
3. Enter your API ID and API Hash (from https://my.telegram.org)
4. Enter your phone number with country code
5. Enter the verification code sent to your Telegram
6. If you have 2FA enabled, enter your 2FA password

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/send-code | Send verification code |
| POST | /api/auth/verify-code | Verify code and get token |
| POST | /api/auth/verify-2fa | Verify 2FA password |
| POST | /api/auth/login | Login with existing session |
| GET | /api/auth/accounts | List saved accounts |
| GET | /api/files | List files/folders (?parent_id=) |
| POST | /api/files/upload | Upload file (multipart) |
| GET | /api/files/download/:id | Download file |
| GET | /api/files/preview/:id | Preview file (inline) |
| DELETE | /api/files/:id | Delete file/folder |
| PUT | /api/files/:id | Rename or move file/folder |
| POST | /api/files/:id/share | Create share link |
| GET | /api/shares/:token | Access shared file |
| POST | /api/folders | Create folder |

## Project Structure

```
telegram-drive-web/
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB, logger config
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Telegram client, file manager
│   │   └── index.js        # Server entry point
│   └── uploads/            # Temp file storage
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/            # Axios HTTP client
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Route pages
│   │   └── store/          # Zustand state
│   └── index.html
└── package.json            # Root workspace config
```
