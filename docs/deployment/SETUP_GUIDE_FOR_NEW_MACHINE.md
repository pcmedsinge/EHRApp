# EHR Application - Complete Setup Guide for New Machine
## Step-by-Step Instructions for Non-Technical Users

---

## 📋 What You Need

### Required Software (Only 2 things!)
1. **Docker Desktop** - Software that runs containers
2. **Git** (Optional) - Software to download code from repository

That's it! No Python, No Node.js, No complicated installations.

---

## 🚀 Part 1: Installing Docker Desktop

### For Windows Users:

**Step 1:** Go to Docker website
- Open your web browser
- Type: `https://docs.docker.com/desktop/install/windows-install/`

**Step 2:** Download Docker Desktop
- Click the blue "Download Docker Desktop" button
- Save the file to your Downloads folder

**Step 3:** Install Docker Desktop
- Find the downloaded file (Docker Desktop Installer.exe)
- Double-click to run it
- Click "OK" when it asks about WSL 2
- Wait for installation (takes 2-5 minutes)
- Click "Close and restart" when finished

**Step 4:** Start Docker Desktop
- Your computer will restart
- After restart, Docker Desktop will open automatically
- Accept the terms and conditions
- Wait for "Docker Desktop is running" message (green icon in bottom left)

**Step 5:** Verify Docker is working
- Press `Windows Key + R`
- Type: `cmd` and press Enter
- In the black window, type: `docker --version`
- You should see something like: `Docker version 24.0.0`
- Type: `docker-compose --version`
- You should see something like: `Docker Compose version 2.20.0`

✅ **Docker is now installed!**

---

### For Mac Users:

**Step 1:** Go to Docker website
- Open Safari or Chrome
- Type: `https://docs.docker.com/desktop/install/mac-install/`

**Step 2:** Download Docker Desktop
- Click "Download Docker Desktop" for your Mac type:
  - If you have M1/M2/M3 Mac: Choose "Apple Silicon"
  - If you have older Intel Mac: Choose "Intel Chip"
- Save the file

**Step 3:** Install Docker Desktop
- Find the downloaded file (Docker.dmg)
- Double-click to open it
- Drag the Docker icon to Applications folder
- Wait for copying to complete

**Step 4:** Start Docker Desktop
- Open Applications folder
- Double-click "Docker"
- Click "Open" when security warning appears
- Accept the terms and conditions
- Enter your Mac password when asked

**Step 5:** Verify Docker is working
- Press `Command + Space`
- Type: `terminal` and press Enter
- In the terminal window, type: `docker --version`
- You should see: `Docker version 24.0.0`
- Type: `docker-compose --version`
- You should see: `Docker Compose version 2.20.0`

✅ **Docker is now installed!**

---

### For Linux Users:

**Step 1:** Open Terminal
- Press `Ctrl + Alt + T`

**Step 2:** Run these commands one by one
```bash
# Update package list
sudo apt-get update

# Install Docker
sudo apt-get install docker.io docker-compose -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
```

**Step 3:** Verify Docker is working
```bash
docker --version
docker-compose --version
```

✅ **Docker is now installed!**

---

## 📦 Part 2: Getting the EHR Application Code

### Method 1: Using Git (Recommended)

**Step 1:** Install Git (if not already installed)

**Windows:**
- Go to: `https://git-scm.com/download/win`
- Download and install Git for Windows
- Use default settings during installation

**Mac:**
- Git is usually pre-installed
- Open Terminal and type: `git --version`
- If not installed, it will prompt you to install

**Linux:**
```bash
sudo apt-get install git -y
```

**Step 2:** Download the code
```bash
# Open Terminal (Mac/Linux) or Command Prompt (Windows)
# Navigate to where you want to save the code
cd Desktop

# Download the code (replace <your-repo-url> with actual URL)
git clone <your-repo-url>

# Go into the folder
cd EHRApp
```

---

### Method 2: Using ZIP File (If no Git)

**Step 1:** Get the ZIP file
- Ask your developer to give you a ZIP file of the code
- Or download from your repository website (GitHub/GitLab)
- Click "Code" → "Download ZIP"

**Step 2:** Extract the ZIP file
- Right-click the ZIP file
- Choose "Extract All" (Windows) or "Unzip" (Mac)
- Remember where you extracted it

**Step 3:** Open Terminal in that folder

**Windows:**
- Open the extracted EHRApp folder
- Hold `Shift` and right-click in empty space
- Choose "Open PowerShell window here" or "Open Command window here"

**Mac:**
- Open the extracted EHRApp folder
- Right-click on the folder
- Choose "New Terminal at Folder"

**Linux:**
- Open the extracted EHRApp folder
- Right-click in empty space
- Choose "Open in Terminal"

---

## 🎯 Part 3: Running the Application

### Step 1: Make sure Docker Desktop is running

**Check Docker Desktop:**
- **Windows/Mac:** Look for Docker icon in system tray (bottom-right on Windows, top-right on Mac)
- Icon should be "steady" not "animated"
- If not running, click the Docker Desktop icon to start it
- Wait for "Docker Desktop is running" message

**Linux:**
```bash
sudo systemctl status docker
# Should show "active (running)" in green
```

---

### Step 2: Deploy the application

**In your Terminal/Command Prompt (inside EHRApp folder):**

```bash
# Make the deployment script executable (Mac/Linux only)
chmod +x docker-deploy.sh

# Run the deployment script
./docker-deploy.sh
```

**For Windows PowerShell:**
```powershell
docker-compose -f docker-compose.full.yml up -d --build
```

---

### Step 3: Wait for deployment

You will see messages like:
```
🏗️  Building Docker images...
[+] Building 45.2s (23/23) FINISHED
🚀 Starting all services...
⏳ Waiting for services to be healthy...
```

**This will take 3-10 minutes the first time** (downloading and building images)

**What's happening:**
- Downloading base images (Python, Node.js, PostgreSQL, etc.)
- Building your application containers
- Starting all services
- Running database migrations
- Checking if everything is healthy

---

### Step 4: Success! Application is running

When you see this message:
```
✅ Deployment Complete!

🌐 Application URLs:
   Frontend:     http://localhost:3000
   Backend API:  http://localhost:8000
   API Docs:     http://localhost:8000/docs
```

**Your application is now running!**

---

### Step 5: Access the application

**Open your web browser and go to:**
```
http://localhost:3000
```

**Login with default credentials:**
- Username: `admin`
- Password: `admin123`

🎉 **You're done! The application is running on your machine!**

---

## 🔍 Part 4: Verifying Everything Works

### Check 1: Frontend is running
- Open: `http://localhost:3000`
- You should see the EHR login page
- ✅ Frontend working!

### Check 2: Backend API is running
- Open: `http://localhost:8000/docs`
- You should see API documentation page
- ✅ Backend working!

### Check 3: OHIF Viewer is running
- Open: `http://localhost:3001`
- You should see OHIF Viewer interface
- ✅ Viewer working!

### Check 4: Orthanc PACS is running
- Open: `http://localhost:8042`
- Enter username: `orthanc`
- Enter password: `orthanc`
- You should see Orthanc interface
- ✅ PACS working!

**If all checks pass, everything is working perfectly!**

---

## 🛠️ Part 5: Common Issues and Solutions

### Issue 1: "Docker is not running"

**Solution:**
- Make sure Docker Desktop is open and running
- Look for Docker icon in system tray
- If not running, click Docker Desktop to start it
- Wait 30 seconds and try again

---

### Issue 2: "Port already in use"

**Error message:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**
```bash
# Stop all containers
docker-compose -f docker-compose.full.yml down

# Check what's using the port
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# If something else is using it, stop that program
# Then try deployment again
./docker-deploy.sh
```

---

### Issue 3: "Cannot connect to Docker daemon"

**Linux Users:**
```bash
# Start Docker service
sudo systemctl start docker

# Try again
./docker-deploy.sh
```

**Windows/Mac Users:**
- Close Docker Desktop completely
- Open Docker Desktop again
- Wait for "Docker Desktop is running" message
- Try again

---

### Issue 4: Deployment is very slow

**This is normal the first time!**
- First deployment downloads ~2-3 GB of images
- Takes 5-15 minutes depending on internet speed
- Subsequent deployments are much faster (30 seconds - 2 minutes)

**Speed it up:**
- Use a faster internet connection
- Don't close Terminal while it's running

---

### Issue 5: "Cannot find docker-compose.full.yml"

**Solution:**
- Make sure you are in the correct folder
- Check by typing:
  ```bash
  # Windows
  dir
  
  # Mac/Linux
  ls
  ```
- You should see: `docker-compose.full.yml` in the list
- If not, navigate to the correct folder:
  ```bash
  cd /path/to/EHRApp
  ```

---

## 📊 Part 6: Daily Usage

### Starting the application

**Every time you want to use the app:**
```bash
# 1. Make sure Docker Desktop is running
# 2. Open Terminal in EHRApp folder
# 3. Run:
docker-compose -f docker-compose.full.yml up -d

# Wait 30 seconds, then access http://localhost:3000
```

---

### Stopping the application

**When you're done:**
```bash
# In Terminal (in EHRApp folder):
docker-compose -f docker-compose.full.yml down
```

**Or just close Docker Desktop** (it will stop all containers)

---

### Viewing logs (if something is wrong)

```bash
# See all logs
docker-compose -f docker-compose.full.yml logs -f

# See specific service logs
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f frontend-dev

# Press Ctrl+C to stop viewing logs
```

---

### Restarting a service

**If something isn't working:**
```bash
# Restart all services
docker-compose -f docker-compose.full.yml restart

# Restart specific service
docker-compose -f docker-compose.full.yml restart backend
```

---

### Complete reset (if totally broken)

**Nuclear option - wipes everything and starts fresh:**
```bash
# Stop and remove everything including data
docker-compose -f docker-compose.full.yml down -v

# Start fresh
./docker-deploy.sh
```

⚠️ **Warning:** This will delete all data (patients, visits, images)!

---

## 💾 Part 7: Backing Up Your Data

### Quick backup

```bash
# Stop containers first
docker-compose -f docker-compose.full.yml down

# Backup database
docker run --rm -v ehr_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/ehr_backup.tar.gz /data

# Start containers again
docker-compose -f docker-compose.full.yml up -d
```

### Restore backup

```bash
# Stop containers
docker-compose -f docker-compose.full.yml down

# Restore database
docker run --rm -v ehr_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/ehr_backup.tar.gz -C /

# Start containers
docker-compose -f docker-compose.full.yml up -d
```

---

## 🔄 Part 8: Updating the Application

**When developers release new version:**

### Step 1: Get the new code

**Using Git:**
```bash
# Navigate to EHRApp folder
cd /path/to/EHRApp

# Stop application
docker-compose -f docker-compose.full.yml down

# Get latest code
git pull origin main

# Deploy updated version
./docker-deploy.sh
```

**Using ZIP file:**
- Stop application first
- Download new ZIP file
- Extract and replace files
- Run deployment script again

---

## 📱 Part 9: Accessing from Other Devices

### Access from another computer on same network

**Step 1:** Find your computer's IP address

**Windows:**
```cmd
ipconfig
# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

**Mac:**
```bash
ifconfig | grep "inet "
# Look for address like 192.168.1.100 (not 127.0.0.1)
```

**Linux:**
```bash
hostname -I
# First address shown (like 192.168.1.100)
```

**Step 2:** On other device, open browser and go to:
```
http://YOUR_IP_ADDRESS:3000
```

Example: `http://192.168.1.100:3000`

⚠️ **Note:** Both devices must be on same WiFi/network

---

## 🆘 Getting Help

### Check if services are running
```bash
docker-compose -f docker-compose.full.yml ps
```

You should see all services with "Up" status:
```
NAME                STATUS
ehr_backend         Up (healthy)
ehr_frontend_dev    Up
ehr_postgres        Up (healthy)
ehr_orthanc         Up
ehr_ohif            Up
orthanc_postgres    Up
```

### Check service health
```bash
# Check backend
curl http://localhost:8000/docs

# Check frontend
curl http://localhost:3000

# Check database
docker exec ehr_postgres pg_isready
```

### Get detailed logs
```bash
# All services
docker-compose -f docker-compose.full.yml logs --tail=100

# Specific service (last 50 lines)
docker-compose -f docker-compose.full.yml logs --tail=50 backend
```

---

## ✅ Checklist for New Machine Setup

Print this checklist and check off each step:

- [ ] Docker Desktop installed
- [ ] Docker Desktop is running
- [ ] EHRApp code downloaded/extracted
- [ ] Terminal opened in EHRApp folder
- [ ] Deployment script executed (`./docker-deploy.sh`)
- [ ] Waited for completion (5-10 minutes first time)
- [ ] Opened http://localhost:3000 in browser
- [ ] Successfully logged in to application
- [ ] Verified all services are running
- [ ] Bookmarked application URL

**If all checked, you're done! 🎉**

---

## 📞 Support Contact

If you encounter issues not covered in this guide:

1. Check the logs (see "Getting Help" section)
2. Try complete reset (see "Complete reset" section)
3. Contact your system administrator
4. Provide them with:
   - Error message
   - Output of `docker-compose ps`
   - Output of `docker-compose logs`

---

## 🎓 Understanding What Docker Does

**Simple explanation:**

Traditional way (Without Docker):
- Install Python → Install packages → Configure database → Install Node.js → Install npm packages → Configure environment → Run migrations → Start backend → Start frontend
- **Takes hours, many steps can fail**

Docker way:
- Run one script → Everything happens automatically
- **Takes minutes, just works**

**Benefits:**
- ✅ Same setup everywhere (your laptop, coworker's laptop, server)
- ✅ No "it works on my machine" problems
- ✅ Easy to reset if something breaks
- ✅ Isolated from your other software
- ✅ Easy to update

---

**This guide covers everything you need to set up the EHR application on a new machine. Follow the steps in order, and you'll have it running in less than 30 minutes!**
