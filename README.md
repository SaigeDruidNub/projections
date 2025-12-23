# Projections - Project Management & Approval System

A Next.js application for managing projects with CSV projections, checkpoint-based approvals, and feature request tracking. Built with MongoDB and Google OAuth authentication.

## Features

### ✅ Implemented

- **Google OAuth Authentication** - Secure sign-in with Google accounts
- **Project Management** - Create, view, and manage multiple projects
- **CSV Projections** - Upload and display CSV data in table format
- **Checkpoints** - Define approval checkpoints for projects
- **Multi-user Approvals** - Track approvals/rejections from multiple users
- **Feature Requests** - Submit and track new feature proposals with approval workflow

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js v5 (Google OAuth)
- **Styling**: Tailwind CSS
- **CSV Parsing**: PapaParse
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 20+ installed
- MongoDB instance (local or cloud like MongoDB Atlas)
- Google OAuth credentials

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables in `.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/projections
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projections

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env` file

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Authentication

- Sign in with your Google account on the landing page
- You'll be redirected to the dashboard after authentication

### 2. Creating a Project

- Click "Create Project" from the dashboard
- Enter project name and optional description
- Submit to create the project

### 3. Adding Projections

- Navigate to a project
- Go to the "Projections" tab
- Enter a projection name and upload a CSV file
- The data will be displayed in a table format
- Multiple projections can be added to each project

### 4. Setting Up Checkpoints

- Go to the "Checkpoints" tab in a project
- Create checkpoints with names, descriptions, and order
- Checkpoints represent approval gates for projections
- Assign projections to checkpoints for review

### 5. Approval Process

- Users can approve or reject projections at each checkpoint
- Multiple users can provide approvals
- Status is automatically updated based on approvals:
  - **Pending**: Awaiting approvals
  - **Approved**: All reviewers approved
  - **Rejected**: At least one rejection

### 6. Feature Requests

- Go to the "Features" tab
- Submit new feature requests with name and description
- Track feature status: pending, approved, in-progress, completed
- Requires approval before implementation

## Data Models

### User

- Email, name, image
- Google OAuth profile data

### Project

- Name, description
- Created by user reference
- Contains projections, checkpoints, and features

### Projection

- CSV data stored as JSON string
- Associated with a project
- Can be assigned to checkpoints

### Checkpoint

- Ordered approval gates
- Contains projections for review

### CheckpointProjection

- Links projections to checkpoints
- Tracks approval status

### Approval

- User's decision (approved/rejected)
- Optional comment
- Linked to checkpoint projection

### Feature

- Feature request details
- Status tracking
- Approval workflow

### FeatureApproval

- User approvals for features
- Similar to projection approvals

## API Routes

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH/DELETE /api/projects/[id]` - Project operations
- `POST /api/projects/[id]/projections` - Add projections
- `POST /api/projects/[id]/checkpoints` - Create checkpoints
- `POST /api/projects/[id]/features` - Submit feature requests
- `POST /api/approvals/[checkpointProjectionId]` - Submit approvals
- `POST /api/features/[featureId]/approvals` - Approve features

## Database Setup

The application uses MongoDB. When you start the app, it will automatically connect to the database specified in `MONGODB_URI`.

For local development:

```bash
# Install MongoDB locally or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

For production, consider using MongoDB Atlas (free tier available).

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you:

- Set all environment variables
- Use a production MongoDB instance
- Update `NEXTAUTH_URL` to your domain
- Generate a secure `NEXTAUTH_SECRET`

## Security Notes

- Never commit `.env` file to version control
- Use strong `NEXTAUTH_SECRET` in production
- Restrict OAuth redirect URIs to your domains
- Use MongoDB connection strings with authentication

## License

MIT
