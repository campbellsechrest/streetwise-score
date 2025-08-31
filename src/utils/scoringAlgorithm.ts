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
}

export interface ScoringWeights {
  pricePerSqFt: number;
  monthlyFees: number;
  location: number;
  schools: number;
  floor: number;
  buildingQuality: number;
  amenities: number;
  neighborhood: number;
}

export interface ScoreBreakdown {
  overall: number;
  priceValue: number;
  location: number;
  schools: number;
  building: number;
  amenities: number;
  neighborhood: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  pricePerSqFt: 0.25,
  monthlyFees: 0.15,
  location: 0.20,
  schools: 0.15,
  floor: 0.10,
  buildingQuality: 0.10,
  amenities: 0.03,
  neighborhood: 0.02
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

export function calculatePropertyScore(
  property: PropertyData,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  // Price per square foot evaluation (lower is better)
  const pricePerSqFt = property.price / property.squareFeet;
  const priceScore = Math.max(1, Math.min(10, 
    10 - ((pricePerSqFt - 800) / 200) // Assuming $800-$2000/sqft range
  ));

  // Monthly fees evaluation (lower is better)
  const monthlyFeesScore = Math.max(1, Math.min(10,
    10 - ((property.monthlyFees - 500) / 300) // Assuming $500-$3500 range
  ));

  // Combined price value score
  const priceValue = (priceScore + monthlyFeesScore) / 2;

  // Location score based on walk/transit scores
  const walkScore = property.walkScore || 50;
  const transitScore = property.transitScore || 50;
  const location = Math.max(1, Math.min(10, (walkScore + transitScore) / 20));

  // School district score
  const schools = SCHOOL_DISTRICT_SCORES[property.schoolDistrict] || 5;

  // Floor score (higher floors generally better, but not too high)
  const floorRatio = property.floor / property.totalFloors;
  const floor = Math.max(1, Math.min(10, 
    floorRatio < 0.2 ? 4 : // Ground floors
    floorRatio > 0.8 ? 7 : // Top floors
    floorRatio * 10 // Middle floors
  ));

  // Building quality (based on age and amenities)
  const ageScore = Math.max(1, Math.min(10, 10 - (property.buildingAge / 10)));
  const building = ageScore;

  // Amenities score
  const amenityCount = property.amenities.length;
  const amenities = Math.max(1, Math.min(10, amenityCount + 3));

  // Neighborhood score (simplified - could be enhanced with real data)
  const bikeScore = property.bikeScore || 50;
  const neighborhood = Math.max(1, Math.min(10, bikeScore / 10));

  // Calculate weighted overall score
  const overall = Math.round(
    (priceValue * weights.pricePerSqFt) +
    (location * weights.location) +
    (schools * weights.schools) +
    (floor * weights.floor) +
    (building * weights.buildingQuality) +
    (amenities * weights.amenities) +
    (neighborhood * weights.neighborhood) +
    (monthlyFeesScore * weights.monthlyFees)
  );

  return {
    overall: Math.max(1, Math.min(10, overall)),
    priceValue: Math.round(priceValue * 10) / 10,
    location: Math.round(location * 10) / 10,
    schools: Math.round(schools * 10) / 10,
    building: Math.round(building * 10) / 10,
    amenities: Math.round(amenities * 10) / 10,
    neighborhood: Math.round(neighborhood * 10) / 10
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