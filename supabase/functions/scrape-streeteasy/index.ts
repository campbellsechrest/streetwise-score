import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// API integrations
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    console.log('=== SCRAPE STREETEASY FUNCTION CALLED ===');
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

    // Extract property data using OpenAI first, then regex fallback
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
  console.log('Extracting property data from HTML...');
  
  // Extract address from URL - normalize underscores to spaces and handle apartment number
  const urlParts = url.split('/');
  const buildingSlug = urlParts[4] || '';
  const apartmentPart = urlParts[5] || '';
  
  let address = buildingSlug.replace(/_/g, ' ').replace(/-/g, ' ');
  let aptNumber = '';
  
  if (apartmentPart && apartmentPart !== '') {
    aptNumber = apartmentPart.toUpperCase();
  }

  // Try OpenAI extraction first if API key is available
  if (OPENAI_API_KEY) {
    try {
      console.log('OPENAI_API_KEY is available, attempting OpenAI extraction...');
      const openAIResult = await extractWithOpenAI(html, address, aptNumber);
      if (openAIResult) {
        console.log('OpenAI extraction successful with building age:', openAIResult.buildingAge);
        return openAIResult;
      } else {
        console.log('OpenAI extraction returned null, falling back to regex');
      }
    } catch (error) {
      console.log('OpenAI extraction failed with error, falling back to regex:', error.message);
    }
  } else {
    console.log('No OPENAI_API_KEY found in environment, using regex extraction');
  }
  
  // Try to extract building info from JSON-LD first
  const jsonLdData = extractJSONLD(html);
  console.log('JSON-LD data found:', jsonLdData);

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
  
  console.log('=== EXTRACTING MONTHLY FEES ===');
  
  // First, try to find combined monthly charges patterns (more reliable)
  const combinedPatterns = [
    /Monthly charges?[:\s]*\$([0-9,]+)/i,
    /Total monthly[:\s]*\$([0-9,]+)/i,
    /Monthly payment[:\s]*\$([0-9,]+)/i,
    /Monthly fee[:\s]*\$([0-9,]+)/i,
    /Common charges?[:\s]*\$([0-9,]+)(?:\/mo)?/i
  ];
  
  let combinedFound = false;
  for (const pattern of combinedPatterns) {
    const match = html.match(pattern);
    if (match) {
      monthlyFees = parseInt(match[1].replace(/,/g, ''));
      console.log(`Found combined monthly fees using pattern ${pattern}: $${monthlyFees}`);
      combinedFound = true;
      break;
    }
  }
  
  // If no combined pattern found, try separate maintenance and taxes
  if (!combinedFound) {
    console.log('No combined monthly fees found, trying separate maintenance and taxes...');
    
    // Look for maintenance fee with more specific patterns
    const maintenancePatterns = [
      /Maintenance[:\s]*\$([0-9,]+)(?:\/mo)?/i,
      /Maintenance fee[:\s]*\$([0-9,]+)(?:\/mo)?/i,
      /\$([0-9,]+)\/mo[^0-9]*maintenance/i
    ];
    
    let maintenance = 0;
    for (const pattern of maintenancePatterns) {
      const match = html.match(pattern);
      if (match) {
        maintenance = parseInt(match[1].replace(/,/g, ''));
        console.log(`Found maintenance using pattern ${pattern}: $${maintenance}`);
        break;
      }
    }
    
    // Look for taxes with more specific patterns
    const taxPatterns = [
      /Tax(?:es)?[:\s]*\$([0-9,]+)(?:\/mo)?/i,
      /Property tax[:\s]*\$([0-9,]+)(?:\/mo)?/i,
      /\$([0-9,]+)\/mo[^0-9]*tax/i
    ];
    
    let taxes = 0;
    for (const pattern of taxPatterns) {
      const match = html.match(pattern);
      if (match) {
        taxes = parseInt(match[1].replace(/,/g, ''));
        console.log(`Found taxes using pattern ${pattern}: $${taxes}`);
        break;
      }
    }
    
    console.log(`Maintenance: $${maintenance}, Taxes: $${taxes}`);
    
    // Only combine if both are reasonable amounts and sum makes sense
    if (maintenance > 0 && taxes > 0 && (maintenance + taxes) < 20000) {
      monthlyFees = maintenance + taxes;
      console.log(`Combined maintenance + taxes: $${monthlyFees}`);
    } else if (maintenance > 0 && taxes === 0) {
      monthlyFees = maintenance;
      console.log(`Using maintenance only: $${monthlyFees}`);
    } else if (taxes > 0 && maintenance === 0) {
      monthlyFees = taxes;
      console.log(`Using taxes only: $${monthlyFees}`);
    }
  }
  
  // Fallback: try generic monthly pattern but be more selective
  if (monthlyFees === 0) {
    console.log('No specific monthly fees found, trying generic patterns...');
    const genericMatches = html.match(/\$([0-9,]+)\/mo/g) || [];
    
    for (const match of genericMatches) {
      const amount = parseInt(match.replace(/[$,\/mo]/g, ''));
      // Only consider reasonable monthly fee amounts (not price)
      if (amount > 500 && amount < 20000) {
        monthlyFees = amount;
        console.log(`Using generic monthly pattern: $${monthlyFees}`);
        break;
      }
    }
  }
  
  console.log(`=== FINAL MONTHLY FEES: $${monthlyFees} ===`);

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
  
  // Use JSON-LD data if available
  if (jsonLdData?.yearBuilt) {
    buildingAge = new Date().getFullYear() - parseInt(jsonLdData.yearBuilt);
    console.log(`Building age from JSON-LD: ${buildingAge} (built ${jsonLdData.yearBuilt})`);
  }
  
  if (jsonLdData?.numberOfFloors) {
    totalFloors = parseInt(jsonLdData.numberOfFloors);
    console.log(`Total floors from JSON-LD: ${totalFloors}`);
  }
  
  // If not found in JSON-LD, try multiple patterns for total floors
  if (totalFloors === 0) {
    totalFloors = await extractTotalFloors(html, address, url);
  }
  
  // If not found in JSON-LD, try multiple patterns for building age  
  if (buildingAge === 0) {
    buildingAge = await extractBuildingAge(html, address, url);
  }

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

function extractJSONLD(html: string): any {
  try {
    // Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        try {
          const data = JSON.parse(jsonContent);
          console.log('Parsed JSON-LD:', data);
          
          // Look for building or residence data
          if (data['@type'] === 'Residence' || data['@type'] === 'Apartment' || data['@type'] === 'Building') {
            return data;
          }
          
          // Handle arrays of structured data
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item['@type'] === 'Residence' || item['@type'] === 'Apartment' || item['@type'] === 'Building') {
                return item;
              }
            }
          }
        } catch (parseError) {
          console.log('Failed to parse JSON-LD:', parseError.message);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log('Error extracting JSON-LD:', error.message);
    return null;
  }
}

async function extractWithOpenAI(html: string, address: string, aptNumber: string): Promise<PropertyData | null> {
  console.log('Starting OpenAI extraction function...');
  if (!OPENAI_API_KEY) {
    console.log('No OPENAI_API_KEY in extractWithOpenAI function');
    return null;
  }

  try {
    // Create a concise version of HTML for OpenAI (remove scripts, styles, etc.)
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 8000); // Limit to first 8k chars to stay within context

    const prompt = `Extract property data from this StreetEasy listing HTML. Return a valid JSON object with these exact fields:

{
  "address": "full address including apartment number",
  "price": number (purchase price in dollars),
  "monthlyFees": number (maintenance + taxes combined per month),
  "floor": number (apartment floor, extract from unit number like 9A = floor 9),
  "totalFloors": number (total floors in building),
  "squareFeet": number (0 if not listed),
  "bedrooms": number,
  "bathrooms": number (can be decimal like 1.5),
  "schoolDistrict": "string (District 1, 2, 3, or Other based on NYC location)",
  "buildingAge": number (current year minus construction year),
  "amenities": ["array of amenities like Doorman, Gym, Pool, etc."],
  "walkScore": number (estimate 60-95 based on NYC location),
  "transitScore": number (estimate 60-95 based on subway access),
  "bikeScore": number (estimate 60-90 based on bike infrastructure)
}

Key patterns to look for:
- Construction year: "1923 built", "built 1925", "built in 1930"
- Price: "$1,450,000" format
- Monthly fees: maintenance + taxes combined
- Floors: "9-story", "15 floors", "story building"
- Amenities: doorman, gym, pool, rooftop, parking, laundry, etc.

Address base: "${address}"
Apartment: "${aptNumber}"

HTML content:
${cleanHtml}

Return ONLY the JSON object, no other text:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a precise data extractor. Return only valid JSON objects with the exact structure requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    console.log('Making OpenAI API request...');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received, extracting content...');
    const extractedText = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const propertyData = JSON.parse(jsonMatch[0]);
    
    // Validate the extracted data
    if (!propertyData || typeof propertyData !== 'object') {
      throw new Error('Invalid property data structure');
    }

    // Ensure required fields and reasonable values
    const validated: PropertyData = {
      address: propertyData.address || `${address} #${aptNumber}`.trim(),
      price: Math.max(0, parseInt(propertyData.price) || 0),
      monthlyFees: Math.max(0, parseInt(propertyData.monthlyFees) || 0),
      floor: Math.max(1, parseInt(propertyData.floor) || 1),
      totalFloors: Math.min(100, Math.max(1, parseInt(propertyData.totalFloors) || 15)),
      squareFeet: Math.max(0, parseInt(propertyData.squareFeet) || 0),
      bedrooms: Math.max(0, parseInt(propertyData.bedrooms) || 1),
      bathrooms: Math.max(0.5, parseFloat(propertyData.bathrooms) || 1),
      schoolDistrict: propertyData.schoolDistrict || 'Other',
      buildingAge: Math.min(300, Math.max(0, parseInt(propertyData.buildingAge) || 50)),
      amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : [],
      walkScore: Math.min(100, Math.max(0, parseInt(propertyData.walkScore) || 75)),
      transitScore: Math.min(100, Math.max(0, parseInt(propertyData.transitScore) || 75)),
      bikeScore: Math.min(100, Math.max(0, parseInt(propertyData.bikeScore) || 70))
    };

    console.log('OpenAI extraction validated successfully');
    return validated;

  } catch (error) {
    console.error('OpenAI extraction error:', error.message);
    return null;
  }
}

async function extractTotalFloors(html: string, address: string, url: string): Promise<number> {
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

async function extractBuildingAge(html: string, address: string, url: string): Promise<number> {
  console.log('Extracting building age for:', address);
  
  const currentYear = new Date().getFullYear();
  
  // Multiple patterns for finding construction year - prioritize common StreetEasy format
  const yearPatterns = [
    /(\d{4})\s+built/gi,  // "1923 built" format from StreetEasy
    /built\s+(\d{4})/gi,  // "built 1923"
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
  
  // Clean HTML for better matching - decode entities and remove extra whitespace
  const cleanedHtml = html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  
  // Add debug logging to see what we're searching  
  console.log('HTML sample (looking for year):', cleanedHtml.substring(0, 2000));
  
  for (const pattern of yearPatterns) {
    const matches = cleanedHtml.match(pattern);
    if (matches) {
      console.log(`Pattern ${pattern.source} matched:`, matches);
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
  
  console.log('No year patterns matched in unit page HTML, trying building page fallback');
  
  // Try to fetch building page if unit page doesn't have the year
  if (url.includes('/building/')) {
    const buildingUrl = url.split('/').slice(0, 5).join('/'); // Remove apartment part
    console.log('Fetching building page:', buildingUrl);

    let buildingHtml = '';

    // Attempt direct fetch first
    try {
      const response = await fetch(buildingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`Direct building fetch failed: ${response.status}`);
      buildingHtml = await response.text();
      console.log('Building page direct fetch successful');
    } catch (err) {
      console.log('Building page direct fetch failed:', (err as Error).message);
      // Fallback to Firecrawl for building page
      if (FIRECRAWL_API_KEY) {
        try {
          console.log('Trying Firecrawl for building page...');
          const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: buildingUrl,
              formats: ['html']
            })
          });
          if (!fcRes.ok) throw new Error(`Firecrawl building fetch failed: ${fcRes.status}`);
          const fcData = await fcRes.json();
          if (fcData?.success && fcData.data?.html) {
            buildingHtml = fcData.data.html as string;
            console.log('Firecrawl building fetch successful');
          }
        } catch (fcErr) {
          console.log('Firecrawl building fetch error:', (fcErr as Error).message);
        }
      } else {
        console.log('No FIRECRAWL_API_KEY available for building page fetch');
      }
    }

    if (buildingHtml) {
      const cleanedBuildingHtml = buildingHtml.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
      
      // Try JSON-LD on building page first
      const buildingJsonLd = extractJSONLD(buildingHtml);
      if (buildingJsonLd?.yearBuilt) {
        const age = currentYear - parseInt(buildingJsonLd.yearBuilt);
        console.log(`Found building year from building page JSON-LD: ${buildingJsonLd.yearBuilt}, age: ${age}`);
        return age;
      }
      
      // Try patterns on building page HTML
      for (const pattern of yearPatterns) {
        const matches = cleanedBuildingHtml.match(pattern);
        if (matches) {
          console.log(`Pattern ${pattern.source} matched on building page:`, matches);
          const years = matches.map(match => {
            const num = match.match(/\d{4}/);
            return num ? parseInt(num[0]) : 0;
          }).filter(year => year >= 1800 && year <= currentYear);
          
          if (years.length > 0) {
            const builtYear = Math.min(...years);
            const age = currentYear - builtYear;
            if (age >= 0 && age <= 300) {
              console.log(`Found building year from building page: ${builtYear}, age: ${age}`);
              return age;
            }
          }
        }
      }
    }
  }

  console.log('No year patterns matched anywhere, falling back to web search');
  
  // Fallback: try to search for building information online only if direct extraction fails
  if (address) {
    try {
      const searchResult = await searchBuildingInfo(address, 'built constructed year history');
      if (searchResult.year > 0) {
        const age = currentYear - searchResult.year;
        console.log(`Found building year via search: ${searchResult.year}, age: ${age}`);
        return age;
      }
    } catch (error) {
      console.log('Web search fallback failed for building age:', (error as Error).message);
    }
  }

  // Last resort: Heuristics for common NYC building types
  if (html.toLowerCase().includes('prewar') || html.toLowerCase().includes('pre-war')) {
    console.log('Found "prewar" mention, estimating age as 80 years (built ~1945)');
    return 80;
  }
  
  console.log('Could not determine building age, using conservative default');
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
