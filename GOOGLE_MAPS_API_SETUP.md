# How to Get a Google Maps API Key

Follow these steps to obtain your Google Maps API key:

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"NEW PROJECT"**
5. Give it a name (e.g., "ParkMe")
6. Click **"CREATE"**

## Step 2: Enable the Maps JavaScript API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Maps JavaScript API"**
3. Click on it
4. Click **"ENABLE"**

## Step 3: Create Credentials (API Key)

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created
5. **IMPORTANT**: Click **"RESTRICT KEY"** to secure it

## Step 4: Restrict Your API Key (Security Best Practice)

1. Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
2. Click **"ADD AN ITEM"**
3. Add these patterns:
   - `http://localhost:*` (for local development)
   - `https://yourdomain.com/*` (for production)
4. Under **"API restrictions"**, select **"Restrict key"**
5. Choose **"Maps JavaScript API"**
6. Click **"SAVE"**

## Step 5: Add the Key to Your Project

1. Copy your API key
2. Create a `.env` file in your project root (if it doesn't exist)
3. Add this line:

```env
VITE_GOOGLE_MAPS_API_KEY=your-copied-api-key-here
```

4. **Never commit the `.env` file to git!** (It should be in `.gitignore`)

## Troubleshooting

### Error: "This API project is not authorized to use this API"

**Solution:** Make sure you've enabled the Maps JavaScript API in Step 2.

### Error: "RefererNotAllowedMapError"

**Solution:** Check your HTTP referrer restrictions in Step 4. Make sure `http://localhost:*` is added for development.

### Map not loading in production

**Solution:** Add your production domain to the HTTP referrer restrictions in the Google Cloud Console.

## Free Tier Limits

- Google Maps provides **$200 free credit per month**
- That's roughly **28,000 map loads per month** for free
- Perfect for development and small to medium projects
- Check usage in the [Billing Dashboard](https://console.cloud.google.com/billing)

## Additional APIs (Optional)

For more features, you might want to enable:
- **Places API** - For search autocomplete
- **Geocoding API** - For converting addresses to coordinates
- **Directions API** - For routing

But these are optional - the basic Maps JavaScript API is all you need for the ParkMe app!

## Important Notes

⚠️ **Never share your API key publicly**  
⚠️ **Always restrict your API key** (Step 4)  
⚠️ **Monitor your usage** in the Google Cloud Console  
⚠️ **Set up billing alerts** to avoid unexpected charges

