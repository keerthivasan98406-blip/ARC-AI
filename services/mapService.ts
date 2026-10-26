export interface LocationInfo {
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl: string;
  embedUrl: string;
}

export const getLocationInfo = async (locationQuery: string): Promise<LocationInfo | null> => {
  try {
    // Use OpenStreetMap Nominatim API for geocoding (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Arc AI Assistant'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const location = data[0];
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lon);
      
      return {
        name: location.display_name,
        coordinates: { lat, lng },
        mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`,
        embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const detectLocationQuery = (text: string): string | null => {
  // Detect location-related queries
  const locationPatterns = [
    /where is (.+?)[\?\.]?$/i,
    /show me (.+?) on (?:the )?map/i,
    /location of (.+?)[\?\.]?$/i,
    /find (.+?) on map/i,
    /map of (.+?)[\?\.]?$/i,
    /directions to (.+?)[\?\.]?$/i,
    /how to reach (.+?)[\?\.]?$/i,
    /show (.+?) location/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};
