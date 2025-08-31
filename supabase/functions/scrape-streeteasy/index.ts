import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Firecrawl API integration
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

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

    let html = '';
    
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Direct fetch failed: ${response.status}`);
      }

      html = await response.text();
      console.log('Direct fetch successful, HTML length:', html.length);
      
    } catch (directFetchError) {
      console.log('Direct fetch failed, trying Firecrawl:', directFetchError.message);
      
      if (!FIRECRAWL_API_KEY) {
        throw new Error('Direct fetch failed and no Firecrawl API key available');
      }

      // Fallback to Firecrawl
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          formats: ['html']
        })
      });

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text();
        throw new Error(`Firecrawl failed: ${firecrawlResponse.status} - ${errorText}`);
      }

      const firecrawlData = await firecrawlResponse.json();
      
      if (!firecrawlData.success || !firecrawlData.data?.html) {
        throw new Error('Firecrawl did not return valid HTML data');
      }

      html = firecrawlData.data.html;
      console.log('Firecrawl fetch successful, HTML length:', html.length);
    }

    // Extract property data using regex patterns
    const propertyData = await extractPropertyData(html, url);
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

async function extractPropertyData(html: string, url: string): Promise<PropertyData> {
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

  // Extract maintenance fees and taxes (combine them)
  let monthlyFees = 0;
  
  // Look for maintenance fee
  const maintenanceMatch = html.match(/Maintenance[\s\S]*?\$([0-9,]+)(?:\/mo)?/i) || 
                          html.match(/Common charges[\s\S]*?\$([0-9,]+)(?:\/mo)?/i) ||
                          html.match(/\$([0-9,]+)\/mo.*maintenance/i);
  let maintenance = 0;
  if (maintenanceMatch) {
    maintenance = parseInt(maintenanceMatch[1].replace(/,/g, ''));
  }
  
  // Look for taxes
  const taxMatch = html.match(/Tax(?:es)?[\s\S]*?\$([0-9,]+)(?:\/mo)?/i) || 
                  html.match(/\$([0-9,]+)\/mo.*tax/i) ||
                  html.match(/Property tax[\s\S]*?\$([0-9,]+)(?:\/mo)?/i);
  let taxes = 0;
  if (taxMatch) {
    taxes = parseInt(taxMatch[1].replace(/,/g, ''));
  }
  
  // Combine maintenance and taxes
  monthlyFees = maintenance + taxes;
  
  // If we didn't find separate values, try to find a combined monthly fee
  if (monthlyFees === 0) {
    const combinedMatch = html.match(/\$([0-9,]+)\/mo/);
    if (combinedMatch) {
      monthlyFees = parseInt(combinedMatch[1].replace(/,/g, ''));
    }
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

  // Extract building info with multiple patterns and fallbacks
  let totalFloors = 0;
  let buildingAge = 0;
  
  // Try multiple patterns for total floors
  totalFloors = await extractTotalFloors(html, address);
  
  // Try multiple patterns for building age  
  buildingAge = await extractBuildingAge(html, address);

  // Extract square footage (leave blank if not listed)
  let squareFeet = 0; // Default to 0 if not found
  const sqftMatch = html.match(/(\d+)\s*(?:sq\.?\s*ft\.?|ft²|square feet)/i);
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

async function extractTotalFloors(html: string, address: string): Promise<number> {
  console.log('Extracting total floors for:', address);
  
  // Multiple patterns for finding total floors
  const floorPatterns = [
    /(\d+)\s*-?\s*story/gi,
    /(\d+)\s*-?\s*stories/gi,
    /(\d+)\s*floors?/gi,
    /building.*?(\d+)\s*floors?/gi,
    /(\d+)\s*floor\s*building/gi,
    /total.*?(\d+)\s*floors?/gi,
    /(\d+)\s*level/gi,
    /height.*?(\d+)\s*floors?/gi,
    /(\d+)\s*fl\b/gi
  ];
  
  for (const pattern of floorPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      // Extract all potential floor numbers and find the most reasonable one
      const floorNumbers = matches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }).filter(num => num > 0 && num <= 100); // Reasonable building height
      
      if (floorNumbers.length > 0) {
        // Take the most common number, or the first reasonable one
        const floors = floorNumbers.sort((a, b) => b - a)[0];
        if (floors >= 2 && floors <= 100) {
          console.log(`Found total floors: ${floors} using pattern`);
          return floors;
        }
      }
    }
  }
  
  // Fallback: try to search for building information online
  if (address) {
    try {
      const searchResult = await searchBuildingInfo(address, 'floors stories height');
      if (searchResult.floors > 0) {
        console.log(`Found total floors via search: ${searchResult.floors}`);
        return searchResult.floors;
      }
    } catch (error) {
      console.log('Web search fallback failed for floors:', error.message);
    }
  }
  
  console.log('Could not determine total floors, using default');
  return 15; // Default fallback
}

async function extractBuildingAge(html: string, address: string): Promise<number> {
  console.log('Extracting building age for:', address);
  
  const currentYear = new Date().getFullYear();
  
  // Multiple patterns for finding construction year
  const yearPatterns = [
    /built\s*in\s*(\d{4})/gi,
    /(\d{4})\s*built/gi,
    /constructed\s*in\s*(\d{4})/gi,
    /(\d{4})\s*construction/gi,
    /year\s*built:?\s*(\d{4})/gi,
    /built:?\s*(\d{4})/gi,
    /(\d{4})\s*vintage/gi,
    /erected\s*in\s*(\d{4})/gi,
    /(\d{4})\s*building/gi,
    /circa\s*(\d{4})/gi,
    /c\.\s*(\d{4})/gi
  ];
  
  for (const pattern of yearPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      const years = matches.map(match => {
        const num = match.match(/\d{4}/);
        return num ? parseInt(num[0]) : 0;
      }).filter(year => year >= 1800 && year <= currentYear);
      
      if (years.length > 0) {
        // Take the most reasonable year (likely the earliest valid one)
        const builtYear = Math.min(...years);
        const age = currentYear - builtYear;
        if (age >= 0 && age <= 300) {
          console.log(`Found building year: ${builtYear}, age: ${age}`);
          return age;
        }
      }
    }
  }
  
  // Fallback: try to search for building information online
  if (address) {
    try {
      const searchResult = await searchBuildingInfo(address, 'built constructed year history');
      if (searchResult.year > 0) {
        const age = currentYear - searchResult.year;
        console.log(`Found building year via search: ${searchResult.year}, age: ${age}`);
        return age;
      }
    } catch (error) {
      console.log('Web search fallback failed for building age:', error.message);
    }
  }
  
  console.log('Could not determine building age, using default');
  return 50; // Default fallback
}

async function searchBuildingInfo(address: string, searchTerms: string): Promise<{floors: number, year: number}> {
  console.log('Searching web for building info:', address);
  
  // Clean up address for search
  const cleanAddress = address.replace(/#.*$/, '').trim();
  const searchQuery = `"${cleanAddress}" NYC building ${searchTerms}`;
  
  try {
    // Use a web search API or scrape search results
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const searchHtml = await response.text();
    
    // Extract building information from search results
    let floors = 0;
    let year = 0;
    
    // Look for floors in search results
    const floorMatch = searchHtml.match(/(\d+)\s*(?:story|stories|floor|floors)/gi);
    if (floorMatch) {
      const floorNumbers = floorMatch.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }).filter(num => num >= 2 && num <= 100);
      
      if (floorNumbers.length > 0) {
        floors = Math.max(...floorNumbers);
      }
    }
    
    // Look for construction year in search results
    const yearMatch = searchHtml.match(/(?:built|constructed|erected).*?(\d{4})|(\d{4}).*?(?:built|constructed)/gi);
    if (yearMatch) {
      const years = yearMatch.map(match => {
        const num = match.match(/\d{4}/);
        return num ? parseInt(num[0]) : 0;
      }).filter(y => y >= 1800 && y <= new Date().getFullYear());
      
      if (years.length > 0) {
        year = Math.min(...years); // Take earliest reasonable year
      }
    }
    
    return { floors, year };
    
  } catch (error) {
    console.log('Web search error:', error.message);
    return { floors: 0, year: 0 };
  }
}
