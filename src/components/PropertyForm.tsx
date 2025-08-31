import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PropertyData } from '@/utils/scoringAlgorithm';
import { UrlInput } from '@/components/UrlInput';

const AMENITIES_OPTIONS = [
  'Doorman', 'Elevator', 'Gym', 'Pool', 'Rooftop/Garden', 'Laundry', 'Storage', 'Bike Room',
  'Playground', 'Live-In Super', 'Parking'
];

const HOME_FEATURES_OPTIONS = [
  'Fireplace', 'Private outdoor space', 'Washer/dryer', 'Dishwasher', 'Central air', 
  'Loft', 'Hardwood floors', 'Home office'
];

const SCHOOL_DISTRICTS = [
  'District 1', 'District 2', 'District 3', 'District 15', 'District 20', 'District 22',
  'Stuyvesant HS Zone', 'Bronx Science Zone', 'Brooklyn Tech Zone', 'Other'
];

const BUILDING_TYPES = [
  { value: 'prewar', label: 'Pre-War (before 1945)' },
  { value: 'postwar', label: 'Post-War (1945-1980)' },
  { value: 'modern', label: 'Modern (1980+)' },
  { value: 'luxury', label: 'Luxury Building' },
  { value: 'historic', label: 'Historic/Landmark' },
  { value: 'other', label: 'Other' }
];

const PRICE_HISTORY = [
  { value: 'stable', label: 'Stable' },
  { value: 'increased', label: 'Recently Increased' },
  { value: 'decreased', label: 'Recently Decreased' }
];

interface PropertyFormProps {
  onSubmit: (property: PropertyData) => void;
  isLoading?: boolean;
}

export function PropertyForm({ onSubmit, isLoading }: PropertyFormProps) {
  const [showUrlInput, setShowUrlInput] = useState(true);
  const [formData, setFormData] = useState<Partial<PropertyData>>({
    address: '',
    price: 0,
    monthlyFees: 0,
    floor: 1,
    totalFloors: 10,
    squareFeet: 0,
    bedrooms: 1,
    bathrooms: 1,
    schoolDistrict: 'District 2',
    buildingAge: 50,
    amenities: [],
    homeFeatures: [],
    walkScore: 70,
    transitScore: 80,
    bikeScore: 60,
    buildingType: 'other',
    petFriendly: false,
    priceHistory: 'stable',
    safetyScore: 6,
    proximityToPark: 5,
    proximityToSubway: 3,
    daysOnMarket: 30,
    noiseLevel: 5
  });

  const handleDataExtracted = (extractedData: PropertyData) => {
    setFormData(extractedData);
    setShowUrlInput(false);
  };

  const handleToggleManual = () => {
    setShowUrlInput(false);
  };

  const handleBackToUrl = () => {
    setShowUrlInput(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as PropertyData);
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...(prev.amenities || []), amenity]
        : (prev.amenities || []).filter(a => a !== amenity)
    }));
  };

  const handleHomeFeaturesChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      homeFeatures: checked 
        ? [...(prev.homeFeatures || []), feature]
        : (prev.homeFeatures || []).filter(f => f !== feature)
    }));
  };

  if (showUrlInput) {
    return (
      <UrlInput 
        onDataExtracted={handleDataExtracted}
        onToggleManual={handleToggleManual}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Property Details</CardTitle>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleBackToUrl}
          className="ml-auto"
        >
          Use URL Instead
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, New York, NY"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="price">Sale Price ($)</Label>
              <Input
                id="price"
                type="text"
                placeholder="1,250,000"
                value={formData.price ? formData.price.toLocaleString() : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (numericValue === '' || !isNaN(Number(numericValue))) {
                    setFormData(prev => ({ ...prev, price: numericValue === '' ? 0 : Number(numericValue) }));
                  }
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyFees">Monthly Fees ($)</Label>
              <Input
                id="monthlyFees"
                type="text"
                placeholder="1,200"
                value={formData.monthlyFees ? formData.monthlyFees.toLocaleString() : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (numericValue === '' || !isNaN(Number(numericValue))) {
                    setFormData(prev => ({ ...prev, monthlyFees: numericValue === '' ? 0 : Number(numericValue) }));
                  }
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="squareFeet">Square Feet</Label>
              <Input
                id="squareFeet"
                type="text"
                placeholder="1,200"
                value={formData.squareFeet ? formData.squareFeet.toLocaleString() : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (numericValue === '' || !isNaN(Number(numericValue))) {
                    setFormData(prev => ({ ...prev, squareFeet: numericValue === '' ? 0 : Number(numericValue) }));
                  }
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                step="1"
                placeholder="3"
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: isNaN(Number(e.target.value)) ? 0 : Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                step="0.5"
                placeholder="2"
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: isNaN(Number(e.target.value)) ? 0 : Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="floor">Floor Number</Label>
              <Input
                id="floor"
                type="number"
                placeholder="5"
                value={formData.floor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="totalFloors">Total Floors in Building</Label>
              <Input
                id="totalFloors"
                type="number"
                placeholder="20"
                value={formData.totalFloors || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, totalFloors: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="buildingAge">Building Age (years)</Label>
              <Input
                id="buildingAge"
                type="number"
                placeholder="10"
                value={formData.buildingAge || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, buildingAge: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="schoolDistrict">School District</Label>
              <Select 
                value={formData.schoolDistrict || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, schoolDistrict: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="buildingType">Building Type</Label>
              <Select 
                value={formData.buildingType || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, buildingType: value as PropertyData['buildingType'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="proximityToSubway">Minutes to Subway</Label>
              <Input
                id="proximityToSubway"
                type="number"
                placeholder="5"
                value={formData.proximityToSubway || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, proximityToSubway: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="proximityToPark">Minutes to Park</Label>
              <Input
                id="proximityToPark"
                type="number"
                placeholder="10"
                value={formData.proximityToPark || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, proximityToPark: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="safetyScore">Safety Score (1-10)</Label>
              <Input
                id="safetyScore"
                type="number"
                min="1"
                max="10"
                placeholder="6"
                value={formData.safetyScore || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, safetyScore: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="noiseLevel">Noise Level (1-10, lower is quieter)</Label>
              <Input
                id="noiseLevel"
                type="number"
                min="1"
                max="10"
                placeholder="5"
                value={formData.noiseLevel || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, noiseLevel: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="priceHistory">Price History</Label>
              <Select 
                value={formData.priceHistory || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priceHistory: value as PropertyData['priceHistory'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select history" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_HISTORY.map((history) => (
                    <SelectItem key={history.value} value={history.value}>{history.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="daysOnMarket">Days on Market</Label>
              <Input
                id="daysOnMarket"
                type="number"
                placeholder="0"
                value={formData.daysOnMarket !== undefined ? formData.daysOnMarket : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, daysOnMarket: Number(e.target.value) }))}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-base font-semibold">Building Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={(formData.amenities || []).includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-base font-semibold">Home Features</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {HOME_FEATURES_OPTIONS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={(formData.homeFeatures || []).includes(feature)}
                    onCheckedChange={(checked) => handleHomeFeaturesChange(feature, checked as boolean)}
                  />
                  <Label htmlFor={feature} className="text-sm">{feature}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-base font-semibold">Lifestyle Preferences</Label>
            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="petFriendly"
                checked={formData.petFriendly || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, petFriendly: checked as boolean }))}
              />
              <Label htmlFor="petFriendly" className="text-sm">Pet Friendly</Label>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? 'Calculating Score...' : 'Evaluate Property'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}