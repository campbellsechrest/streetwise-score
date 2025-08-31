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
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  
  // Enhanced building data
  buildingType?: 'prewar' | 'postwar' | 'modern' | 'luxury' | 'historic' | 'other';
  renovationYear?: number;
  constructionQuality?: 'basic' | 'good' | 'luxury' | 'ultra-luxury';
  
  // Location enhancements
  neighborhood?: string;
  proximityToPark?: number; // minutes walk
  proximityToSubway?: number; // minutes walk
  safetyScore?: number; // 1-10
  
  // Property specifics
  hasParking?: boolean;
  parkingType?: 'garage' | 'street' | 'assigned' | 'none';
  outdoorSpace?: 'none' | 'balcony' | 'terrace' | 'garden' | 'rooftop';
  noiseLevel?: number; // 1-10, 1 being quiet
  petFriendly?: boolean;
  
  // Market context
  daysOnMarket?: number;
  priceHistory?: 'increased' | 'decreased' | 'stable';
  marketTrend?: 'hot' | 'warm' | 'cool' | 'cold';
  
  // Financial
  propertyTaxes?: number;
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
  
  // Adjust based on market trend
  const marketMultiplier = {
    'hot': 1.2,
    'warm': 1.1,
    'cool': 0.9,
    'cold': 0.8
  }[property.marketTrend || 'warm'] || 1.0;
  
  expectedPriceRange.min *= marketMultiplier;
  expectedPriceRange.max *= marketMultiplier;
  
  // Price score (lower price per sqft is better)
  const priceScore = Math.max(1, Math.min(10, 
    10 - ((pricePerSqFt - expectedPriceRange.min) / (expectedPriceRange.max - expectedPriceRange.min)) * 8
  ));
  
  // Monthly fees with total cost consideration
  const totalMonthlyCost = property.monthlyFees + (property.propertyTaxes || 0) / 12;
  const monthlyFeesScore = Math.max(1, Math.min(10,
    10 - ((totalMonthlyCost - 500) / 400) // Adjusted range for total costs
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
  const currentYear = new Date().getFullYear();
  const ageScore = Math.max(1, Math.min(10, 10 - (property.buildingAge / 15)));
  
  // Building type bonus
  const buildingTypeScore = BUILDING_TYPE_SCORES[property.buildingType || 'other'];
  
  // Construction quality multiplier
  const qualityMultiplier = CONSTRUCTION_QUALITY_MULTIPLIERS[property.constructionQuality || 'good'];
  
  // Renovation impact
  let renovationBonus = 1.0;
  if (property.renovationYear) {
    const yearsSinceRenovation = currentYear - property.renovationYear;
    renovationBonus = Math.max(1.0, Math.min(1.8, 1.5 - (yearsSinceRenovation / 20)));
  }
  
  // Floor preference (middle floors generally preferred)
  const floorRatio = property.floor / property.totalFloors;
  const floorScore = floorRatio < 0.2 ? 0.8 : // Ground floors
                    floorRatio > 0.8 ? 0.9 : // Top floors  
                    1.0; // Middle floors
  
  const combinedScore = (ageScore * 0.4 + buildingTypeScore * 0.6) * qualityMultiplier * renovationBonus * floorScore;
  return Math.max(1, Math.min(10, combinedScore));
}

function calculateEnhancedAmenities(property: PropertyData): number {
  let score = Math.min(8, property.amenities.length + 2);
  
  // Parking bonus (significant in NYC)
  if (property.hasParking) {
    const parkingBonus = {
      'garage': 2.0,
      'assigned': 1.5,
      'street': 0.5,
      'none': 0
    }[property.parkingType || 'none'];
    score += parkingBonus;
  }
  
  // Outdoor space bonus
  const outdoorBonus = {
    'garden': 2.0,
    'rooftop': 1.8,
    'terrace': 1.5,
    'balcony': 1.0,
    'none': 0
  }[property.outdoorSpace || 'none'];
  score += outdoorBonus;
  
  return Math.max(1, Math.min(10, score));
}

function calculateMarketContext(property: PropertyData): number {
  let score = 5; // baseline
  
  // Market trend impact
  const trendScore = {
    'hot': 8,
    'warm': 6,
    'cool': 4,
    'cold': 2
  }[property.marketTrend || 'warm'];
  
  // Price history impact
  const historyBonus = {
    'stable': 0,
    'increased': -0.5, // Recently increased might be overpriced
    'decreased': 1.0   // Price reduction could indicate good deal
  }[property.priceHistory || 'stable'];
  
  // Assessment ratio (good indicator of value)
  const assessmentBonus = property.assessmentRatio ? 
    Math.max(-2, Math.min(2, (0.8 - property.assessmentRatio) * 5)) : 0;
  
  return Math.max(1, Math.min(10, trendScore + historyBonus + assessmentBonus));
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