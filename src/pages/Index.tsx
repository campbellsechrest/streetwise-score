import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/PropertyForm';
import { ScoreCard } from '@/components/ScoreCard';
import { PropertyData, ScoreBreakdown, calculatePropertyScore } from '@/utils/scoringAlgorithm';

const Index = () => {
  const [currentProperty, setCurrentProperty] = useState<PropertyData | null>(null);
  const [currentScores, setCurrentScores] = useState<ScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handlePropertySubmit = async (property: PropertyData) => {
    setIsCalculating(true);
    
    // Simulate calculation time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const scores = calculatePropertyScore(property);
    setCurrentProperty(property);
    setCurrentScores(scores);
    setIsCalculating(false);
  };

  const handleNewEvaluation = () => {
    setCurrentProperty(null);
    setCurrentScores(null);
  };

  if (currentScores && currentProperty) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary">Property Evaluation Results</h1>
            <Button 
              onClick={handleNewEvaluation}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Evaluate Another Property
            </Button>
          </div>
          
          <ScoreCard 
            scores={currentScores}
            address={currentProperty.address}
            price={currentProperty.price}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
            Streetwise Score
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Intelligent property evaluation that analyzes StreetEasy listings using advanced 
            algorithms. Simply paste a listing URL or enter details manually to get data-driven 
            scores based on price, location, schools, and amenities.
          </p>
        </div>
        
        <PropertyForm onSubmit={handlePropertySubmit} isLoading={isCalculating} />
      </div>
    </div>
  );
};

export default Index;