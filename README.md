@"
# 🛡️ AuthGuard Enterprise: Role & Identity Infrastructure

A full-stack authorization and access-management platform built with **FastAPI** and **React 18 (Vite)**, demonstrating zero-trust Role-Based Access Control (RBAC), asymmetric JWT token authentication, and direct bcrypt hashing.

---

## ⚡ Architecture Overview

- **Backend (\`fastapi_user_roles/\`)**:
  - FastAPI with dependency-injected JWT Bearer token authentication
  - SQLite + SQLAlchemy ORM with automated entity-relational role mapping
  - Admin-guarded endpoints (\`403 Forbidden\` enforcement for non-admins)
  - Direct 72-byte safe \`bcrypt\` password hashing

- **Frontend (\`user-roles-frontend/\`)**:
  - React 18 SPA built with Vite
  - Modern, responsive Dark-Indigo Glassmorphism console
  - Dynamic clearance role assignment matrix
  - Live session tracking and JWT storage

---

## 🚀 Quickstart

### 1. Backend Setup
\`\`\`bash
cd fastapi_user_roles
python -m venv venv
# Windows
.\venv\Scripts\Activate.ps1
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`
Interactive API docs available at \`http://127.0.0.1:8000/docs\`.

### 2. Frontend Setup
\`\`\`bash
cd user-roles-frontend
npm install
npm run dev
\`\`\`
Portal console running at \`http://localhost:5173\`.
"@ | Out-File -FilePath README.md -Encoding utf8
