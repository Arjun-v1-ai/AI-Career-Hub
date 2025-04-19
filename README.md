Jeet Gaye 🎉💪

# AI Career Hub

A comprehensive career guidance platform with AI-powered features including video proctoring, resume analysis, and career counseling.

## Project Structure

```
📁 AI-Career-Hub
├── 📁 app
├── 📁 assets
├── 📁 components
├── 📁 db
├── 📁 lib
├── 📁 models
├── 📁 public
├── 📁 server
├── 📁 services
└── 📁 utils
├── 📄 .gitignore
├── 📄 ABOUT_BOT.md
├── 📄 Bot_structure.png
├── 📄 README.md
├── 📄 eslint.config.mjs
├── 📄 jsconfig.json
├── 📄 next.config.mjs
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 postscs.config.mjs
├── 📄 providers.js
└── 📄 tailwind.config.mjs
```

## Prerequisites

- Node.js 20.x or later
- Python 3.11 or later
- npm or yarn package manager

## Getting Started

### Frontend Setup (Next.js)

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a .env.local file in the root directory and add necessary environment variables:
```env
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_AUTH_SECRET=
NEXT_PUBLIC_GEMINI_API_KEY=
GOOGLE_API_KEY=
MONGODB_URI=
NEXT_AUTH_URL=
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend application will be available at http://localhost:3000

### Backend Setup (Python FastAPI)

1. Navigate to the server directory:
```bash
cd server
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

3. Start the Python server:
```bash
python -m uvicorn main:app --reload --port 3001 --host 0.0.0.0
```

The backend API will be available at http://localhost:3001

> *Important*: Make sure to update the following in your frontend configuration:
> - Set API URI to localhost:3001
> - Set domain to localhost:3000

## Features

- Video proctoring with face detection and movement analysis
- Real-time career guidance
- Resume analysis
- User authentication and profile management
- Assessment system

## API Endpoints

### Backend (FastAPI)
- GET `/health` - Health check endpoint
- POST `/analyze` - Video analysis endpoint

### Frontend (Next.js)
- `/api/auth/*` - Authentication routes
- `/api/career-guidance` - Career guidance endpoints
- `/api/resume-analysis` - Resume analysis endpoint

## Development

- The frontend uses Next.js 15+ with App Router
- The backend implements FastAPI with MediaPipe for video analysis
- Authentication is handled via NextAuth.js
- Styling is done with Tailwind CSS
