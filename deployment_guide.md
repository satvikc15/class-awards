# 🚀 Deployment Guide: Locally Hosted Backend + Vercel Frontend

To achieve your setup (local backend exposed via Cloudflare + frontend on Vercel), I have already **modified your frontend code** to support a new environment variable: `VITE_API_URL`. This allows Vercel to know where to send API requests without having to hardcode your local IP address.

Follow these step-by-step instructions to get everything live.

---

## Step 1: Start Your Backend Locally
First, we need to run your FastAPI backend on your machine.

1. Open your terminal in this workspace (`c:\Users\satvi\Desktop\coding\class-awards`).
2. Navigate to the backend directory and activate your virtual environment:
   ```cmd
   cd backend
   ..\venv\Scripts\activate
   ```
3. Start the FastAPI server (it runs on port 8000 by default):
   ```cmd
   uvicorn main:app --port 8000
   ```
   *Leave this terminal window open. If this window closes, your backend goes offline.*

---

## Step 2: Expose Your Backend via Cloudflare
Next, we will use Cloudflare Tunnels to safely expose your local `localhost:8000` to the public internet securely with HTTPS.

1. Download the `cloudflared` executable for Windows from Cloudflare's official GitHub via this link: [cloudflared-windows-amd64.exe](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe)
2. Rename the downloaded file to `cloudflared.exe` and place it somewhere accessible (like your project folder or Desktop).
3. Open a **new, separate terminal** and run this command:
   ```cmd
   cloudflared.exe tunnel --url http://127.0.0.1:8000
   ```
4. Cloudflare will generate a random URL that looks something like this:
   `https://random-words-here.trycloudflare.com`
   
**Copy this URL** and hold onto it. This is your temporary live backend URL! *(Note: Every time you restart the cloudflare tunnel, this URL will change. For persistent URLs, you'd need a Cloudflare account and your own domain.)*

---

## Step 3: Deploy the Frontend to Vercel
Vercel requires the code to be either synced from a GitHub repository, or pushed via their Command Line Interface (CLI). The Vercel CLI is the fastest way if you aren't using GitHub.

1. Open a **third terminal** in your main project folder `c:\Users\satvi\Desktop\coding\class-awards`.
2. Install the Vercel CLI (requires Node.js):
   ```cmd
   npm i -g vercel
   ```
3. Run the deployment command:
   ```cmd
   vercel
   ```
4. Vercel will ask you a series of questions:
   - **Set up and deploy?** Use arrow keys and press `y`
   - **Which scope?** (Press Enter to select your account)
   - **Link to existing project?** Type `N`
   - **What's your project's name?** `class-awards` (or whatever you prefer)
   - **In which directory is your code located?** Hit Enter for `./`
   - **Auto-detected Project Settings (Vite)?** Hit `N` to modify settings.

5. **CRITICAL STEP: Environment Variables**
   When it asks if you want to modify settings, say **Yes** (`Y`). 
   - `Build Command`: `npm run build`
   - `Output Directory`: `dist`
   - `Development Command`: (leave default, hit Enter)
   - **Vercel will ask if you want to set any Environment Variables?** Say **Yes**.
   - **What's the name?** Type exactly: `VITE_API_URL`
   - **What's the value?** Paste the **Cloudflare URL** you copied in Step 2. (Make sure there is **no trailing slash** at the end. E.g., `https://random-words.trycloudflare.com`).

Alternatively, if you already zipped through the setup or use GitHub to deploy, you can go to your Vercel Dashboard -> Your Project -> **Settings** -> **Environment Variables**. Add `VITE_API_URL` as the key, and your Cloudflare URL as the value, and redeploy!

---

## Step 4: Test Your App
Vercel will give you a live frontend URL (like `https://class-awards.vercel.app`).
1. Go to this URL.
2. Enter a test roll number (e.g. `100522729001`) and test the OTP email. 
3. If emails log successfully, and you can vote, you are done!

*(Note: Your backend `.env` file already has `CORS_ORIGINS="*"` which will automatically allow the requests coming from Vercel).*
