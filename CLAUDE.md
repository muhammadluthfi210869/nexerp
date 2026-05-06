# ERP FROM ZERO - Project Guide

## 🏗 System Overview
- **Backend**: NestJS + Prisma (SQLite/PostgreSQL)
- **Dashboard**: React (Vite) + Lucide Icons + Tailwind (if requested)
- **Design DNA**: "Binary Audit Vision" v7.0 (Dark mode, glassmorphism, premium UI)

## 🛑 Anti-Looping Protocols
To prevent repetitive mistakes and "looping" on the same problem:
1. **Context Check**: Always list the directory (`ls` or `dir`) and read the relevant file BEFORE attempting any edit.
2. **One Change at a Time**: Complete one logical block before moving to the next.
3. **Verify After Write**: Use `grep` or `view_file` to confirm the change was applied correctly and hasn't introduced syntax errors.
4. **Three-Strike Rule**: If an error persists after 3 attempts, STOP and ask the user for clarification. Do not guess.
5. **No Blind Deletes**: Never delete data or large blocks of code without verifying its usage across the workspace.

## 💻 Tech Stack Specifics
- **Backend Modules**: `backend/src/modules/` (Commercial, Legal, rnd, scm, etc.)
- **Dashboard Views**: `dashboard/src/views/`
- **Database**: Prisma schema in `backend/prisma/`

## 🛠 Command Shortcuts
- `npm run dev` in `dashboard/` to start UI.
- `npm run start:dev` in `backend/` to start NestJS.
- `npx prisma studio` for database viewer.
