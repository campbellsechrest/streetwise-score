import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  address: string;
  price: number;
  monthlyFees: number;
  floor: number;
  totalFloors: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  schoolDistrict: string;
  buildingAge: number;
  amenities: string[];
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Scraping StreetEasy URL:', url);

    // Fetch the StreetEasy page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    console.log('Fetched HTML, length:', html.length);

    // Extract property data using regex patterns
    const propertyData = extractPropertyData(html, url);
    console.log('Extracted property data:', propertyData);

    return new Response(JSON.stringify({ success: true, data: propertyData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error scraping StreetEasy:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to scrape listing'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractPropertyData(html: string, url: string): PropertyData {
  // Extract address from URL or page
  const addressMatch = url.match(/\/building\/([^\/]+)/);
  let address = '';
  if (addressMatch) {
    address = addressMatch[1]
      .replace(/-/g, ' ')
      .replace(/_/g, ', ')
      .split('/')[0];
  }

  // Extract apartment number from URL
  const aptMatch = url.match(/\/([^\/]+)$/);
  let aptNumber = '';
  if (aptMatch) {
    aptNumber = aptMatch[1].toUpperCase();
  }

  // Extract floor from apartment number
  let floor = 1;
  if (aptNumber) {
    const floorMatch = aptNumber.match(/^(\d+)/);
    if (floorMatch) {
      floor = parseInt(floorMatch[1]);
    }
  }

  // Extract price
  let price = 0;
  const priceMatch = html.match(/\$([0-9,]+,000)/);
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/,/g, ''));
  }

  // Extract maintenance fees
  let monthlyFees = 0;
  const feesMatch = html.match(/\$([0-9,]+)\/mo/);
  if (feesMatch) {
    monthlyFees = parseInt(feesMatch[1].replace(/,/g, ''));
  }

  // Extract bedrooms and bathrooms
  let bedrooms = 1;
  let bathrooms = 1;
  
  const bedroomMatch = html.match(/(\d+)\s+bed/);
  if (bedroomMatch) {
    bedrooms = parseInt(bedroomMatch[1]);
  }
  
  const bathroomMatch = html.match(/(\d+(?:\.5)?)\s+bath/);
  if (bathroomMatch) {
    bathrooms = parseFloat(bathroomMatch[1]);
  }

  // Extract building info
  let totalFloors = 15;
  let buildingAge = 50;
  
  const storiesMatch = html.match(/(\d+)\s+stories/);
  if (storiesMatch) {
    totalFloors = parseInt(storiesMatch[1]);
  }

  const builtMatch = html.match(/(\d{4})\s+built/);
  if (builtMatch) {
    const builtYear = parseInt(builtMatch[1]);
    buildingAge = new Date().getFullYear() - builtYear;
  }

  // Extract square footage (often not listed for co-ops)
  let squareFeet = estimateSquareFootage(bedrooms, bathrooms);
  const sqftMatch = html.match(/(\d+)\s*ft²/);
  if (sqftMatch) {
    squareFeet = parseInt(sqftMatch[1]);
  }

  // Extract amenities
  const amenities = extractAmenities(html);

  // Determine school district based on neighborhood
  let schoolDistrict = 'Other';
  if (html.includes('Greenwich Village') || html.includes('Washington Square')) {
    schoolDistrict = 'District 2';
  } else if (html.includes('Upper East Side')) {
    schoolDistrict = 'District 2';
  } else if (html.includes('Upper West Side')) {
    schoolDistrict = 'District 3';
  } else if (html.includes('Tribeca') || html.includes('Financial District')) {
    schoolDistrict = 'District 1';
  }

  // Estimate walk/transit scores based on neighborhood
  const walkScore = estimateWalkScore(html);
  const transitScore = estimateTransitScore(html);
  const bikeScore = estimateBikeScore(html);

  return {
    address: `${address} #${aptNumber}`.trim(),
    price,
    monthlyFees,
    floor,
    totalFloors,
    squareFeet,
    bedrooms,
    bathrooms,
    schoolDistrict,
    buildingAge,
    amenities,
    walkScore,
    transitScore,
    bikeScore
  };
}

function extractAmenities(html: string): string[] {
  const amenities: string[] = [];
  
  const amenityPatterns = [
    'Doorman', 'doorman',
    'Gym', 'gym', 'fitness',
    'Pool', 'pool',
    'Rooftop', 'rooftop', 'roof deck',
    'Parking', 'parking',
    'Laundry', 'laundry',
    'Concierge', 'concierge',
    'Storage', 'storage',
    'Pet Friendly', 'pet', 'cats', 'dogs',
    'Balcony', 'balcony',
    'Elevator', 'elevator',
    'Garden', 'garden',
    'Bike', 'bike room',
    'Business Center', 'business center'
  ];

  for (const pattern of amenityPatterns) {
    if (html.toLowerCase().includes(pattern.toLowerCase())) {
      const standardAmenity = getStandardAmenity(pattern);
      if (standardAmenity && !amenities.includes(standardAmenity)) {
        amenities.push(standardAmenity);
      }
    }
  }

  return amenities;
}

function getStandardAmenity(pattern: string): string | null {
  const lowerPattern = pattern.toLowerCase();
  
  if (lowerPattern.includes('doorman')) return 'Doorman';
  if (lowerPattern.includes('gym') || lowerPattern.includes('fitness')) return 'Gym';
  if (lowerPattern.includes('pool')) return 'Pool';
  if (lowerPattern.includes('rooftop') || lowerPattern.includes('roof deck')) return 'Rooftop';
  if (lowerPattern.includes('parking')) return 'Parking';
  if (lowerPattern.includes('laundry')) return 'Laundry';
  if (lowerPattern.includes('concierge')) return 'Concierge';
  if (lowerPattern.includes('storage')) return 'Storage';
  if (lowerPattern.includes('pet') || lowerPattern.includes('cats') || lowerPattern.includes('dogs')) return 'Pet Friendly';
  if (lowerPattern.includes('balcony')) return 'Balcony';
  if (lowerPattern.includes('elevator')) return 'Elevator';
  if (lowerPattern.includes('garden')) return 'Garden';
  if (lowerPattern.includes('bike')) return 'Bike Storage';
  if (lowerPattern.includes('business center')) return 'Business Center';
  
  return null;
}

function estimateSquareFootage(bedrooms: number, bathrooms: number): number {
  // Rough NYC apartment size estimates
  const baseSqft = bedrooms === 0 ? 400 : bedrooms * 350;
  const bathBonus = (bathrooms - 1) * 50;
  return Math.round(baseSqft + bathBonus);
}

function estimateWalkScore(html: string): number {
  // Greenwich Village, SoHo, Tribeca = high walk scores (85-95)
  // Upper East/West Side = good walk scores (75-85)
  // Other areas = moderate (65-75)
  
  const lowerHtml = html.toLowerCase();
  
  if (lowerHtml.includes('greenwich village') || 
      lowerHtml.includes('soho') || 
      lowerHtml.includes('tribeca') ||
      lowerHtml.includes('washington square')) {
    return Math.floor(Math.random() * 10) + 85; // 85-95
  }
  
  if (lowerHtml.includes('upper east side') || 
      lowerHtml.includes('upper west side') ||
      lowerHtml.includes('chelsea') ||
      lowerHtml.includes('midtown')) {
    return Math.floor(Math.random() * 10) + 75; // 75-85
  }
  
  return Math.floor(Math.random() * 10) + 65; // 65-75
}

function estimateTransitScore(html: string): number {
  // Count subway references to estimate transit accessibility
  const subwayMatches = (html.match(/subway|train|station/gi) || []).length;
  
  if (subwayMatches > 10) return Math.floor(Math.random() * 15) + 80; // 80-95
  if (subwayMatches > 5) return Math.floor(Math.random() * 15) + 70; // 70-85
  return Math.floor(Math.random() * 15) + 60; // 60-75
}

function estimateBikeScore(html: string): number {
  // NYC neighborhoods generally have decent bike scores
  const lowerHtml = html.toLowerCase();
  
  if (lowerHtml.includes('bike lane') || lowerHtml.includes('bike room')) {
    return Math.floor(Math.random() * 15) + 75; // 75-90
  }
  
  return Math.floor(Math.random() * 20) + 60; // 60-80
}
