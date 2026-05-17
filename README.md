# FileVault — Backend

A minimal Node.js/Express REST API that handles file uploads, metadata storage, and static file serving. Files are persisted to disk and tracked in MongoDB.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Runtime    | Node.js 18+                         |
| Framework  | Express 4                           |
| Database   | MongoDB (via Mongoose 8)            |
| File Upload| Multer (disk storage, 10 MB limit)  |
| Config     | dotenv                              |
| CORS       | cors                                |

---

## Project Structure

```
backend/
├── controllers/
│   └── fileController.js   # Business logic: upload, list, delete
├── middleware/
│   └── uploadMiddleware.js  # Multer config: storage, filter, size limit
├── models/
│   └── File.js             # Mongoose schema for file metadata
├── routes/
│   └── fileRoutes.js       # Express router: POST /files, GET /files, DELETE /files/:id
├── uploads/                # Disk-stored files (auto-created on startup)
├── server.js               # Entry point: Express app + MongoDB connection
├── .env                    # Environment variables (not committed)
└── package.json
```

---

## Environment Variables

Create a `.env` file in the `backend/` root:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
CORS_ORIGIN=http://localhost:3000
```

| Variable      | Required | Description                                      |
|---------------|----------|--------------------------------------------------|
| `PORT`        | No       | Port the server listens on. Defaults to `5000`.  |
| `MONGO_URI`   | **Yes**  | Full MongoDB connection string.                  |
| `CORS_ORIGIN` | No       | Allowed CORS origin. Defaults to `*` (all).      |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start in development (with auto-reload via nodemon)
npm run dev

# Start in production
npm start
```

---

## API Reference

Base URL: `https://filevaulttask.onrender.com` (production) or `http://localhost:5000` (local)

---

### `GET /files`
Returns a list of all uploaded file metadata, sorted newest-first.

**Response `200 OK`**
```json
[
  {
    "_id": "664f1a2b...",
    "filename": "1716893739123-report.pdf",
    "originalname": "report.pdf",
    "mimetype": "application/pdf",
    "size": 204800,
    "path": "uploads/1716893739123-report.pdf",
    "createdAt": "2025-05-28T12:00:00.000Z",
    "updatedAt": "2025-05-28T12:00:00.000Z"
  }
]
```

---

### `POST /files`
Uploads a file. Expects `multipart/form-data` with a field named `file`.

**Allowed MIME types**
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`, `application/msword`, `.docx`, `.xls`, `.xlsx`
- Archives: `application/zip`

**Size limit:** 10 MB

**Request**
```
Content-Type: multipart/form-data
Body: file=<binary>
```

**Response `201 Created`**
```json
{
  "message": "File uploaded successfully",
  "file": { ...fileObject }
}
```

**Error responses**

| Status | Condition                      | Message                                     |
|--------|--------------------------------|---------------------------------------------|
| `400`  | No file in request             | `"No file uploaded"`                        |
| `400`  | File exceeds 10 MB             | `"File too large. Maximum size is 10MB"`    |
| `400`  | Disallowed MIME type           | `"File type <type> is not allowed. ..."`    |
| `500`  | Server / DB error              | `"Server Error"`                            |

---

### `DELETE /files/:id`
Deletes a file by its MongoDB `_id`. Removes both the DB record and the file on disk.

**Response `200 OK`**
```json
{ "message": "File deleted successfully" }
```

**Error responses**

| Status | Condition        | Message                  |
|--------|------------------|--------------------------|
| `404`  | ID not found     | `"File not found"`       |
| `500`  | Server error     | `"Server Error"`         |

---

### `GET /uploads/:filename`
Serves the raw file binary directly from disk. Used by the frontend to construct download links.

---

## Data Model — `File`

```js
{
  filename:     String,   // Unique disk filename (timestamp-original)
  originalname: String,   // Original filename from the client
  mimetype:     String,   // MIME type (e.g. "application/pdf")
  size:         Number,   // File size in bytes
  path:         String,   // Relative disk path (e.g. "uploads/...")
  createdAt:    Date,     // Auto-set by Mongoose timestamps
  updatedAt:    Date,
}
```

---

## Deployment Notes

- The `uploads/` directory is auto-created on server start if it doesn't exist.
- On platforms like Render (ephemeral filesystem), uploaded files are lost on redeploy. For persistence, migrate to an object store (S3, Cloudflare R2, Supabase Storage).
- Set `CORS_ORIGIN` to your frontend's production URL to prevent unauthorized cross-origin requests.
