export interface PropertyData {
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
  homeFeatures: string[];
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  
  // Enhanced building data
  buildingType?: 'prewar' | 'postwar' | 'modern' | 'luxury' | 'historic' | 'other';
  
  // Location enhancements
  neighborhood?: string;
  proximityToPark?: number; // minutes walk
  proximityToSubway?: number; // minutes walk
  safetyScore?: number; // 1-10
  
  // Property specifics
  noiseLevel?: number; // 1-10, 1 being quiet
  petFriendly?: boolean;
  
  // Market context
  daysOnMarket?: number;
  priceHistory?: 'increased' | 'decreased' | 'stable';
  priceHistoryDetails?: {
    percentageChange?: number;
    timeContext?: string; // e.g., "6 months", "recent"
    analysis?: string; // OpenAI's analysis of the price pattern
    events?: Array<{
      date: string;
      price: number;
      event: string; // 'Listed', 'Sold', 'In Contract', etc.
    }>;
  };
  
  // Financial
  assessmentRatio?: number; // assessment value / market value
}

export interface ScoringWeights {
  priceValue: number;
  location: number;
  schools: number;
  building: number;
  amenities: number;
  neighborhood: number;
  marketContext: number;
  lifestyle: number;
}

export interface ScoreBreakdown {
  overall: number;
  priceValue: number;
  location: number;
  schools: number;
  building: number;
  amenities: number;
  neighborhood: number;
  marketContext: number;
  lifestyle: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  priceValue: 0.25,
  location: 0.20,
  schools: 0.15,
  building: 0.15,
  amenities: 0.08,
  neighborhood: 0.10,
  marketContext: 0.04,
  lifestyle: 0.03
};

const SCHOOL_DISTRICT_SCORES: Record<string, number> = {
  'District 1': 9,
  'District 2': 8,
  'District 3': 7,
  'District 15': 8,
  'District 20': 6,
  'District 22': 5,
  'Stuyvesant HS Zone': 10,
  'Bronx Science Zone': 9,
  'Brooklyn Tech Zone': 8,
  'Other': 5
};

// Building type scoring multipliers
const BUILDING_TYPE_SCORES: Record<string, number> = {
  'prewar': 8.5, // Classic charm, solid construction
  'postwar': 6.5, // Functional but less character
  'modern': 8.0, // Contemporary amenities
  'luxury': 9.5, // High-end finishes and services
  'historic': 8.0, // Character but potential maintenance
  'other': 6.0
};

// Construction quality multipliers
const CONSTRUCTION_QUALITY_MULTIPLIERS: Record<string, number> = {
  'basic': 0.8,
  'good': 1.0,
  'luxury': 1.3,
  'ultra-luxury': 1.5
};

// Helper functions for enhanced scoring
function calculateEnhancedPriceValue(property: PropertyData): number {
  const pricePerSqFt = property.price / property.squareFeet;
  
  // Dynamic price benchmarking based on neighborhood context
  let expectedPriceRange = { min: 800, max: 2000 }; // Default NYC range
  
  // Price score (lower price per sqft is better)
  const priceScore = Math.max(1, Math.min(10, 
    10 - ((pricePerSqFt - expectedPriceRange.min) / (expectedPriceRange.max - expectedPriceRange.min)) * 8
  ));
  
  // Monthly fees score
  const monthlyFeesScore = Math.max(1, Math.min(10,
    10 - ((property.monthlyFees - 500) / 400)
  ));
  
  // Days on market impact (longer = potentially better deal)
  const marketTimeBonus = property.daysOnMarket ? 
    Math.min(1.5, 1 + (property.daysOnMarket - 30) / 100) : 1.0;
  
  return ((priceScore + monthlyFeesScore) / 2) * marketTimeBonus;
}

function calculateEnhancedLocation(property: PropertyData): number {
  const walkScore = property.walkScore || 50;
  const transitScore = property.transitScore || 50;
  const bikeScore = property.bikeScore || 50;
  
  // Proximity bonuses
  const parkProximity = property.proximityToPark ? 
    Math.max(0, 10 - property.proximityToPark / 2) : 5;
  const subwayProximity = property.proximityToSubway ? 
    Math.max(0, 10 - property.proximityToSubway) : 5;
  
  // Safety factor
  const safetyScore = property.safetyScore || 6;
  
  const combinedScore = (
    walkScore * 0.3 + 
    transitScore * 0.3 + 
    bikeScore * 0.1 + 
    parkProximity * 0.1 + 
    subwayProximity * 0.1 + 
    safetyScore * 0.1
  ) / 10;
  
  return Math.max(1, Math.min(10, combinedScore));
}

function calculateEnhancedBuilding(property: PropertyData): number {
  // Base age score
  const ageScore = Math.max(1, Math.min(10, 10 - (property.buildingAge / 15)));
  
  // Building type bonus
  const buildingTypeScore = BUILDING_TYPE_SCORES[property.buildingType || 'other'];
  
  // Floor preference (middle floors generally preferred)
  const floorRatio = property.floor / property.totalFloors;
  const floorScore = floorRatio < 0.2 ? 0.8 : // Ground floors
                    floorRatio > 0.8 ? 0.9 : // Top floors  
                    1.0; // Middle floors
  
  const combinedScore = (ageScore * 0.5 + buildingTypeScore * 0.5) * floorScore;
  return Math.max(1, Math.min(10, combinedScore));
}

function calculateEnhancedAmenities(property: PropertyData): number {
  let score = Math.min(8, property.amenities.length + 2);
  
  // Home features bonus (unit-specific amenities)
  const homeFeatures = property.homeFeatures || [];
  const homeFeaturesScore = homeFeatures.length * 0.5;
  
  // Premium home features get extra points
  const premiumFeatures = ['Fireplace', 'Private outdoor space', 'Washer/dryer', 'Central air'];
  const premiumCount = homeFeatures.filter(feature => premiumFeatures.includes(feature)).length;
  const premiumBonus = premiumCount * 0.3;
  
  score += homeFeaturesScore + premiumBonus;
  
  return Math.max(1, Math.min(10, score));
}

function calculateMarketContext(property: PropertyData): number {
  let score = 5; // baseline
  
  // Enhanced price history analysis using detailed data
  if (property.priceHistoryDetails) {
    const details = property.priceHistoryDetails;
    
    // Percentage change impact (more nuanced than simple increased/decreased)
    if (details.percentageChange !== undefined) {
      if (details.percentageChange < -10) {
        // Significant price reduction - likely good deal
        score += 2.0;
      } else if (details.percentageChange < -5) {
        // Moderate price reduction
        score += 1.0;
      } else if (details.percentageChange > 15) {
        // Significant price increase - potentially overpriced
        score -= 1.5;
      } else if (details.percentageChange > 5) {
        // Moderate price increase - some concern
        score -= 0.5;
      }
    }
    
    // Time context consideration
    if (details.timeContext) {
      const timeContext = details.timeContext.toLowerCase();
      if (timeContext.includes('recent') || timeContext.includes('month')) {
        // Recent changes are more significant
        const timeFactor = 1.2;
        if (details.percentageChange && details.percentageChange < 0) {
          score += 0.5; // Recent price drops are particularly good
        }
      }
    }
    
    // Number of events (market activity indicator)
    if (details.events && details.events.length > 0) {
      const eventCount = details.events.length;
      if (eventCount > 3) {
        // High activity might indicate problematic property
        score -= 0.5;
      } else if (eventCount === 1) {
        // Single listing shows stability
        score += 0.3;
      }
      
      // Check for specific event patterns
      const recentEvents = details.events.slice(-2); // Last 2 events
      const hasRecentPriceReduction = recentEvents.some(event => 
        event.event.toLowerCase().includes('price') && event.event.toLowerCase().includes('reduc')
      );
      if (hasRecentPriceReduction) {
        score += 0.8; // Price reductions are good for buyers
      }
    }
  } else {
    // Fallback to simple price history analysis
    const historyBonus = {
      'stable': 0,
      'increased': -0.5,
      'decreased': 1.0
    }[property.priceHistory || 'stable'];
    score += historyBonus;
  }
  
  // Days on market factor
  if (property.daysOnMarket) {
    if (property.daysOnMarket > 90) {
      // Long time on market might indicate good negotiation opportunity
      score += 0.5;
    } else if (property.daysOnMarket < 7) {
      // Very new listing might be competitively priced
      score += 0.3;
    }
  }
  
  // Assessment ratio (good indicator of value)
  const assessmentBonus = property.assessmentRatio ? 
    Math.max(-2, Math.min(2, (0.8 - property.assessmentRatio) * 5)) : 0;
  score += assessmentBonus;
  
  return Math.max(1, Math.min(10, score));
}

function calculateLifestyle(property: PropertyData): number {
  let score = 5;
  
  // Noise level impact (lower is better)
  if (property.noiseLevel) {
    score += Math.max(-3, (5 - property.noiseLevel) * 0.8);
  }
  
  // Pet friendliness
  if (property.petFriendly) {
    score += 1;
  }
  
  return Math.max(1, Math.min(10, score));
}

export function calculatePropertyScore(
  property: PropertyData,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const priceValue = calculateEnhancedPriceValue(property);
  const location = calculateEnhancedLocation(property);
  const schools = SCHOOL_DISTRICT_SCORES[property.schoolDistrict] || 5;
  const building = calculateEnhancedBuilding(property);
  const amenities = calculateEnhancedAmenities(property);
  const neighborhood = Math.max(1, Math.min(10, (property.bikeScore || 50) / 10));
  const marketContext = calculateMarketContext(property);
  const lifestyle = calculateLifestyle(property);
  
  // Calculate weighted overall score
  const overall = Math.round(
    (priceValue * weights.priceValue) +
    (location * weights.location) +
    (schools * weights.schools) +
    (building * weights.building) +
    (amenities * weights.amenities) +
    (neighborhood * weights.neighborhood) +
    (marketContext * weights.marketContext) +
    (lifestyle * weights.lifestyle)
  );
  
  return {
    overall: Math.max(1, Math.min(10, overall)),
    priceValue: Math.round(priceValue * 10) / 10,
    location: Math.round(location * 10) / 10,
    schools: Math.round(schools * 10) / 10,
    building: Math.round(building * 10) / 10,
    amenities: Math.round(amenities * 10) / 10,
    neighborhood: Math.round(neighborhood * 10) / 10,
    marketContext: Math.round(marketContext * 10) / 10,
    lifestyle: Math.round(lifestyle * 10) / 10
  };
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'score-excellent';
  if (score >= 6.5) return 'score-good';
  if (score >= 5) return 'score-average';
  return 'score-poor';
}

export function getScoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 5) return 'Average';
  return 'Poor';
}