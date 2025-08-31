import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyForm } from '@/components/PropertyForm';
import { ScoreCard } from '@/components/ScoreCard';
import { PropertyData, ScoreBreakdown, calculatePropertyScore } from '@/utils/scoringAlgorithm';
import { Calculator, TrendingUp, MapPin, GraduationCap, Building } from 'lucide-react';
import heroImage from '@/assets/hero-real-estate.jpg';

const Index = () => {
  const [currentProperty, setCurrentProperty] = useState<PropertyData | null>(null);
  const [currentScores, setCurrentScores] = useState<ScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(true);
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

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Property Evaluation</h1>
            <p className="text-xl text-muted-foreground">
              Enter your property details to get an intelligent value score
            </p>
          </div>
          
          <PropertyForm onSubmit={handlePropertySubmit} isLoading={isCalculating} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-primary/30"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Streetwise Score
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Intelligent property evaluation that analyzes StreetEasy listings using advanced 
              algorithms. Get data-driven scores based on price, location, schools, and amenities.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Evaluate a Property
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Property Analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our algorithm evaluates multiple factors to give you an accurate, unbiased property score
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Price Analysis</h3>
                <p className="text-muted-foreground">
                  Evaluates price per square foot and monthly fees against market standards
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Location Score</h3>
                <p className="text-muted-foreground">
                  Walk score, transit access, and neighborhood desirability metrics
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">School Districts</h3>
                <p className="text-muted-foreground">
                  Quality ratings for local school zones and educational opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Building Quality</h3>
                <p className="text-muted-foreground">
                  Age, amenities, floor position, and overall building characteristics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-glow">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Evaluate Your Property?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Get an instant, comprehensive score that helps you make informed real estate decisions
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6 h-auto"
          >
            Start Your Evaluation
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;