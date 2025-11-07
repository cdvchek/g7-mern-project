# Setup & Run Locally

## Project Structure


```bash
.
├─ backend/ # Express + MongoDB (API + sessions)
├─ frontend-web/ # Next.js (React) web app
└─ frontend-ios/ # Flutter (iOS-only app)
```


---


## Backend Setup (`/backend`)


```bash
cd backend
npm install
```
Create a .env file inside `/backend`


```bash
MONGODB_URI=YOUR_MONGODB_URI_HERE
SESSION_NAME=session_id
SESSION_SECRET=CHANGE_ME_TO_A_SECURE_RANDOM_STRING
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

PLAID_ENV=sandbox
PLAID_CLIENT_ID=CHANGE_ME_TO_THE_PLAID_CLIENT_ID
PLAID_SECRET=CHANGE_ME_TO_THE_PLAID_SECRET
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=us

PLAID_ENCRYPTION_KEY_BASE64=CHANGE_ME_TO_THE_PLAID_ENCRYPTION_KEY

RESEND_API_KEY=CHANGE_ME_TO_THE_RESEND_API_KEY
EMAIL_FROM="Budget App <no-reply@myaedojourney.xyz>"
APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
TOKEN_TTL_MINUTES=30
```


Install nodemon:
```bash
npm install -g nodemon
```


Start the backend (from the `/backend` directory):
```bash
nodemon index.js
```
---


## Frontend React Setup (`/frontend-web`)


```bash
cd frontend-web
npm install
npm run dev
```
App will be available at http://localhost:3000


---


## Frontend iOS Setup (`/frontend_ios`)


```bash
cd frontend-ios
flutter pub get
```


Open iOS Simulator
Cmd + Space 
Enter the Simulator
```bash
flutter devices
```
This will show a list of all connected devices. Copy the Device ID
Ex: E414438D-8BD0-4D8D-888D-3CD02349F8F7
```bash
# Replace this device ID with the one you copied from your terminal
flutter run -d E414438D-8BD0-4D8D-888D-3CD02349F8F7
```


Run the app:
```bash
flutter run -d ios
```


---


## After setup, how to start everything:


```bash
# Terminal 1 - Backend
cd backend
nodemon index.js
```


```bash
# Terminal 2 - Web Frontend
cd frontend-web
npm run dev
```


```bash
# Terminal 3 - iOS Frontend
cd frontend-ios
flutter run -d ios
```
