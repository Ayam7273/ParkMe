# How to Get a Google Maps API Key

Follow these steps to obtain your Google Maps API key:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"NEW PROJECT"**
5. Give it a name (e.g., "ParkMe")
6. Click **"CREATE"**

## Step 2: Enable Billing (Required to Remove Watermark)

⚠️ **IMPORTANT**: Even though Google Maps offers a free tier, you **MUST enable billing** to remove the "For development purposes only" watermark.

1. Go to **"Billing"** in the left sidebar
2. Click **"LINK A BILLING ACCOUNT"** or **"MANAGE BILLING ACCOUNTS"**
3. Follow the prompts to add a billing account (credit card required)
4. Don't worry - Google provides **$200 free credit per month**, which covers most small to medium projects
5. You can set up billing alerts to avoid unexpected charges

## Step 3: Enable Required APIs

The ParkMe app requires **three APIs** to be enabled:

### 3a. Enable Maps JavaScript API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Maps JavaScript API"**
3. Click on it
4. Click **"ENABLE"**

### 3b. Enable Places API (Required for Search Autocomplete)

1. Still in **"APIs & Services"** > **"Library"**
2. Search for **"Places API"**
3. Click on it
4. Click **"ENABLE"**

### 3c. Enable Geocoding API (Required for City/Area Search)

1. Still in **"APIs & Services"** > **"Library"**
2. Search for **"Geocoding API"**
3. Click on it
4. Click **"ENABLE"**

## Step 4: Create Credentials (API Key)

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created
5. **IMPORTANT**: Click **"RESTRICT KEY"** to secure it

## Step 5: Restrict Your API Key (Security Best Practice)

1. Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
2. Click **"ADD AN ITEM"**
3. Add these patterns:
   - `http://localhost:*` (for local development)
   - `https://yourdomain.com/*` (for production)
4. Under **"API restrictions"**, select **"Restrict key"**
5. **Select ALL THREE APIs**:
   - ✅ **Maps JavaScript API**
   - ✅ **Places API**
   - ✅ **Geocoding API**
6. Click **"SAVE"**

## Step 6: Add the Key to Your Project

1. Copy your API key
2. Create a `.env` file in your project root (if it doesn't exist)
3. Add this line:

```env
VITE_GOOGLE_MAPS_API_KEY=your-copied-api-key-here
```

4. **Never commit the `.env` file to git!** (It should be in `.gitignore`)

## Troubleshooting

### Error: "This API project is not authorized to use this API"

**Solution:** Make sure you've enabled all three required APIs in Step 3:
- Maps JavaScript API
- Places API
- Geocoding API

### Error: "For development purposes only" watermark on map

**Solution:** You must enable billing on your Google Cloud project (Step 2). Even though Google provides free credits, billing must be enabled to remove the watermark.

### Error: "RefererNotAllowedMapError"

**Solution:** Check your HTTP referrer restrictions in Step 4. Make sure `http://localhost:*` is added for development.

### Map not loading in production

**Solution:** Add your production domain to the HTTP referrer restrictions in the Google Cloud Console.

## Free Tier Limits

- Google Maps provides **$200 free credit per month**
- That's roughly **28,000 map loads per month** for free
- Perfect for development and small to medium projects
- Check usage in the [Billing Dashboard](https://console.cloud.google.com/billing)

## Required APIs Summary

The ParkMe app **requires** these three APIs to function properly:
- ✅ **Maps JavaScript API** - For displaying the map
- ✅ **Places API** - For search autocomplete (city/area search)
- ✅ **Geocoding API** - For converting addresses to coordinates (city/area search)

## Additional APIs (Optional)

For future features, you might want to enable:
- **Directions API** - For routing and navigation
- **Distance Matrix API** - For calculating distances

## Important Notes

⚠️ **Never share your API key publicly**  
⚠️ **Always restrict your API key** (Step 5)  
⚠️ **Enable billing** to remove the watermark (Step 2)  
⚠️ **Enable all three APIs** (Maps JavaScript, Places, Geocoding)  
⚠️ **Monitor your usage** in the Google Cloud Console  
⚠️ **Set up billing alerts** to avoid unexpected charges

