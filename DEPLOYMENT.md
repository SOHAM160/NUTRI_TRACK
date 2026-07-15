# DEPLOYMENT GUIDE: NutriTrack

This guide will walk you through deploying your MERN stack application to production using Vercel (Frontend) and Render (Backend).

## 1. MongoDB Atlas Setup
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (the free tier works fine).
3. Under **Database Access**, create a new database user with a username and password. Keep these secure.
4. Under **Network Access**, add the IP address `0.0.0.0/0` to allow connections from anywhere (since Vercel/Render IPs change dynamically).
5. Click **Connect** on your cluster, select **Connect your application**, and copy the connection string. It will look like: 
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/nutritrack`

## 2. Render Backend Deployment
Render is perfect for Node.js backends. We use `render.yaml` to streamline this.

1. Create a [Render](https://render.com/) account and connect it to your GitHub account.
2. Push your code to a GitHub repository.
3. In Render Dashboard, click **New +** and select **Web Service**.
4. Connect to your GitHub repository.
5. In the configuration:
   - **Name**: `nutritrack-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Scroll down to **Environment Variables** and add all required keys from `.env.example`.
   *Note: Render restarts the server and uses a limited temporary disk. File uploads inside `/uploads` won't persist if they're local. Set up the `CLOUDINARY_*` keys below to ensure they upload to Cloudinary.*

## 3. Vercel Frontend Deployment
Vercel is optimized for frontend applications like React and Vite.

1. Create a [Vercel](https://vercel.com/) account and link your GitHub.
2. Click **Add New** -> **Project** and import your GitHub repository.
3. In the Configuration page:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Important: Click Edit to set it to `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy**.

## 4. Required Environment Variables

### Backend (`backend/.env`)
Set these in Render:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@cluster0...
JWT_SECRET=production_ready_secret_change_me
CLIENT_URL=https://your-vercel-url.vercel.app
SERVER_URL=https://your-render-url.onrender.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_email@domain.com
GROQ_API_KEY=your_groq_api_key
FATSECRET_CLIENT_ID=your_fatsecret_client_id
FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret
```

### Frontend (`frontend/.env`)
Set these in Vercel:
```
VITE_API_URL=https://your-render-url.onrender.com
```

## 5. Build and Start Commands
- **Frontend (Vercel)**:
  - Build: `npm run build` (Inside `/frontend`)
  - Start: Implicit via Vercel Edge caching pointing to `/dist`
- **Backend (Render)**:
  - Build: `npm install` (Inside `/backend`)
  - Start: `npm start` (Runs `node server.js`)

## 6. Common Deployment Errors and Fixes

1. **CORS Errors causing API calls to fail**
   - **Fix**: Ensure `CLIENT_URL` in your Render environment variables exactly matches the Vercel deployed frontend URL (without trailing slashes like `https://my-app.vercel.app`). Also, ensure CORS headers support the OPTIONS preflight request.

2. **File Uploads Disappearing**
   - **Fix**: Free-tier cloud providers are ephemeral (files disappear on restart). Ensure Cloudinary environmental variables are set correctly so that uploads are handled by Cloudinary rather than saved directly to `uploads/`.

3. **Frontend not connecting to API**
   - **Fix**: Ensure `VITE_API_URL` is set to the backend Render URL in your Vercel Dashboard Environment Variables. Remember that you must trigger a new deploy on Vercel for env updates to be injected.

4. **Vite routes not working on reload (404 Error)**
   - **Fix**: Ensure the `vercel.json` rewrite configuration is correctly routing `/(.*)` to `/index.html`. This ensures React Router handles the paths as a typical Single Page Application (SPA).

5. **MongoDB connection string issues**
   - **Fix**: Ensure your username, password, and cluster names do not have unescaped special characters. Also ensure IP Allowlist includes `0.0.0.0/0`.
