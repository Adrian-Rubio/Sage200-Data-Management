# Sage200 Dashboard Web App

## Prerequisites
- Python 3.9+
- Node.js & npm
- ODBC Driver 17 for SQL Server

## Setup

### Backend (FastAPI)
1.  Navigate to `backend/`.
2.  Create a virtual environment: `python -m venv venv`.
3.  Activate it: `venv\Scripts\activate` (Windows).
4.  Install dependencies: `pip install -r requirements.txt`.
5.  Copy `.env.example` to `.env` and fill in your Sage 200 SQL credentials.
6.  Run the server: `uvicorn main:app --reload`.

### Frontend (React + Vite)
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run the dev server: `npm run dev`.

## Architecture
- **Backend**: FastAPI (Python) for data extraction from SQL Server.
- **Frontend**: React (Vite) for dashboard visualization.

## Key Features
- **KPIs**: Revenue, Commission, Unique Clients, Invoice count.
- **Charts**: Sales by Representative, Sales Trend by Day, Commission Distribution.
- **Filtering**:
  - Filter by Date Range (Start/End).
  - Filter by Company.
  - Filter by Sales Representative (Restricted list).
  - Filter by Segmentation/Division (using Invoice Series).
  - Filter by Client.
