import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PropertyData } from '@/utils/scoringAlgorithm';

const AMENITIES_OPTIONS = [
  'Doorman', 'Gym', 'Pool', 'Rooftop', 'Parking', 'Laundry', 
  'Concierge', 'Storage', 'Pet Friendly', 'Balcony', 'Elevator',
  'Garden', 'Bike Storage', 'Business Center'
];

const SCHOOL_DISTRICTS = [
  'District 1', 'District 2', 'District 3', 'District 15', 
  'District 20', 'District 22', 'Stuyvesant HS Zone', 
  'Bronx Science Zone', 'Brooklyn Tech Zone', 'Other'
];

interface PropertyFormProps {
  onSubmit: (property: PropertyData) => void;
  isLoading?: boolean;
}

export function PropertyForm({ onSubmit, isLoading }: PropertyFormProps) {
  const [formData, setFormData] = useState<Partial<PropertyData>>({
    amenities: [],
    schoolDistrict: '',
    walkScore: 70,
    transitScore: 65,
    bikeScore: 60
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.price || !formData.squareFeet) {
      return;
    }

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Property Details</CardTitle>
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
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Sale Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="1250000"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyFees">Monthly Fees ($)</Label>
              <Input
                id="monthlyFees"
                type="number"
                placeholder="1200"
                value={formData.monthlyFees || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyFees: Number(e.target.value) }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="squareFeet">Square Feet</Label>
              <Input
                id="squareFeet"
                type="number"
                placeholder="1200"
                value={formData.squareFeet || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, squareFeet: Number(e.target.value) }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, bedrooms: Number(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, bathrooms: Number(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="floor">Floor Number</Label>
              <Input
                id="floor"
                type="number"
                placeholder="5"
                value={formData.floor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: Number(e.target.value) }))}
                required
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
                required
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
                required
              />
            </div>
            
            <div>
              <Label htmlFor="schoolDistrict">School District</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, schoolDistrict: value }))}>
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