# Yuno920

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Backend | FastAPI (Python) |
| Database | Supabase |
| AI | OpenAI API |
| Deployment | Vercel (frontend), TBD (backend) |

## Project Structure

```
yuno920/
├── frontend/          # Next.js app
├── backend/           # FastAPI app
├── docs/              # Project documentation
├── .gitignore
└── README.md
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000)

### Environment Variables

Copy the example files and fill in your keys:

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```
