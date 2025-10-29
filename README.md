# ParkMe - Smart Parking System

A modern, intelligent parking web application that helps drivers find available parking spaces in real-time with AI-powered predictions and EV spot highlighting.

## Features

- 🗺️ **Google Maps Integration** - Interactive map with clickable markers
- 🔋 **EV Spot Highlighting** - Clearly marked EV-compatible spots with toggle switch
- 📍 **Geolocation Support** - "Use My Location" button for finding nearby parking
- 👤 **User Authentication** - Sign up, login, and profile management with Supabase
- 🎨 **Modern UI** - Responsive design with sidebar navigation
- ⏰ **Time-based Greetings** - Personalized dashboard greeting
- 🔄 **Real-time Updates** - Parking data refreshes every 5 seconds
- 📱 **Mobile Responsive** - Collapsible sidebar for mobile devices

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Get API Keys

**Google Maps API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create credentials (API key)
5. Add the key to your `.env` file

**Supabase:**
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Add to your `.env` file

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Collapsible navigation sidebar
│   ├── ParkingLotCard.jsx    # Parking lot card component
│   └── ProtectedRoute.jsx    # Route protection wrapper
├── contexts/
│   ├── AuthContext.jsx       # Authentication context
│   └── ParkingContext.jsx    # Parking data context
├── pages/
│   ├── Dashboard.jsx         # Main dashboard with greeting
│   ├── MapView.jsx           # Google Maps view
│   ├── Login.jsx             # Login page
│   ├── Signup.jsx            # Sign up page
│   └── Profile.jsx            # User profile page
└── App.jsx                    # Main app component
```

## Features Overview

### Google Maps Integration
- Interactive map with custom colored markers (Green/Red/Blue)
- Info windows with parking details on marker click
- "Open in Google Maps" button for each parking lot
- Auto-zoom and center on selected parking lot

### EV Toggle Switch
- Beautiful toggle switch for filtering EV-only spots
- Clear visual indication of filtering state
- Real-time filtering of parking lots

### Geolocation
- "Use My Location" button to get current location
- Option to filter parking lots by proximity
- Browser geolocation API integration

### Authentication
- Sign up with email and password
- Magic link login option
- Profile management with preferences
- Password change functionality
- Account deletion with confirmation

### Responsive Design
- Collapsible sidebar for desktop
- Mobile-friendly navigation
- Responsive grid layouts
- Touch-friendly controls

## Customization

### Change Colors
Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  primary: '#2563eb',  // Main brand color
  success: '#22c55e',  // Available parking
  danger: '#ef4444',   // Full parking
  info: '#3b82f6',     // EV spots
}
```

### Modify Parking Data
Edit `src/contexts/ParkingContext.jsx` to connect to your backend API:

```js
async function fetchParkingLots() {
  // Replace with your API endpoint
  const response = await fetch('your-api-endpoint')
  return response.json()
}
```

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Maps API** - Map integration
- **Supabase** - Authentication & database
- **Lucide React** - Icons
- **React Router** - Routing

## License

MIT License - feel free to use this project for your own purposes!
