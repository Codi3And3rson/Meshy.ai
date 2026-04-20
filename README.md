# Meshy App 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

A sleek, robust, and secure production-ready web application for generating 3D models using the [Meshy API](https://www.meshy.ai?via=Codie).

> **Note**: To run this application, you will need a Meshy API key. You can support the development of this open-source project by getting your API key via our [affiliate link](https://www.meshy.ai?via=Codie).

## 🌟 Features

- **Modern UI/UX**: Built with React 19, Vite, Framer Motion, and Tailwind-inspired styling for a rich, dynamic user experience.
- **Secure Architecture**: Environment variable driven to ensure your API keys stay out of the frontend and source control.
- **Proxy Backend**: Built on FastAPI, the backend safely acts as an intermediary, avoiding CORS errors and handling download limitations cleanly.
- **Cross-Platform Readiness**: Scripts included for fast setup on Windows, macOS, and Linux.

## 🏗️ Architecture

- **Frontend**: React + Vite (running on port `5173`)
- **Backend**: Python + FastAPI (running on port `8010`)
  
All requests to the Meshy API flow through the FastAPI backend. This allows you to securely inject your `MESHY_API_KEY` on the server instead of distributing it within your web application.

## 🚀 Quick Setup (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [Python](https://www.python.org/) 3.8+

### 1. Configure the Environment
Copy the `.env.example` templates to `.env` files in both directories.
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

If you plan to use this publicly, ensure you set your `MESHY_API_KEY` in `backend/.env`. 

### 2. Install Dependencies
**Backend:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Run the App

**On Windows:**
Simply run the included batch file:
```cmd
start_all.bat
```

**On macOS / Linux:**
Run the included shell script:
```bash
chmod +x start.sh
./start.sh
```

## 🔒 Security
- **Never** commit your `.env` files.
- The `start.sh` / `start_all.bat` are meant for local demonstration. For production deployment, you'll want to use tools like `gunicorn` for the backend, and bundle the React frontend into static files (using `npm run build`), served via an Nginx/Apache configuration or a static hosting provider (like Vercel).
- Pre-configured HTTP proxies limit download exposure via `MAX_DOWNLOAD_BYTES`.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
