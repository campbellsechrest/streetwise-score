import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/PropertyForm';
import { ScoreCard } from '@/components/ScoreCard';
import { PropertyData, ScoreBreakdown, calculatePropertyScore } from '@/utils/scoringAlgorithm';

const Index = () => {
  const [currentProperty, setCurrentProperty] = useState<PropertyData | null>(null);
  const [currentScores, setCurrentScores] = useState<ScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handlePropertySubmit = async (property: PropertyData) => {
    setIsCalculating(true);
    
    // Simulate calculation time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const scores = calculatePropertyScore(property);
    setCurrentProperty(property);
    setCurrentScores(scores);
    setShowResults(true);
    setIsCalculating(false);
  };

  const handleNewEvaluation = () => {
    setCurrentProperty(null);
    setCurrentScores(null);
    setShowResults(false);
  };
  const handleBackToForm = () => {
    setShowResults(false);
  };

  if (showResults && currentScores && currentProperty) {
    return (
      <div id="home" className="min-h-screen bg-background">
        <div className="t-container t-section">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary">Property Evaluation Results</h1>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleBackToForm}
                variant="secondary"
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                Back
              </Button>
              <Button 
                onClick={handleNewEvaluation}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Evaluate Another Property
              </Button>
            </div>
          </div>
          
          <ScoreCard 
            scores={currentScores}
            address={currentProperty.address}
            price={currentProperty.price}
            petFriendly={currentProperty.petFriendly}
            catsAllowed={currentProperty.catsAllowed}
            dogsAllowed={currentProperty.dogsAllowed}
            property={currentProperty}
          />
        </div>
      </div>
    );
  }

  return (
    <div id="home" className="min-h-screen bg-background">
      <section className="t-hero" aria-labelledby="hero-title">
        <div className="t-container">
          <div className="t-hero-copy text-center">
            <p className="t-eyebrow">Data-driven property evaluation</p>
            <h1 id="hero-title" className="font-bold text-primary">Streetwise Score</h1>
            <p className="t-lede">
              Analyze StreetEasy listings in seconds. Paste a URL or enter details to see a transparent, factor‑by‑factor score.
            </p>
            <div className="mt-14">
              <PropertyForm 
                onSubmit={handlePropertySubmit} 
                isLoading={isCalculating} 
                initialData={currentProperty}
                startManual={!!currentProperty}
              />
            </div>
          </div>
        </div>
      </section>
      <section id="about" className="t-section alt" aria-labelledby="about-title">
        <div className="t-container">
          <h2 id="about-title" className="text-2xl font-semibold mb-2">About</h2>
          <p className="text-muted-foreground max-w-3xl">Streetwise Score uses a clear scoring model to help you compare properties quickly. It blends pricing, neighborhood, schools, and amenities into an easy‑to‑scan summary so you can make better decisions faster.</p>
        </div>
      </section>
      <section id="features" className="t-section" aria-labelledby="features-title">
        <div className="t-container grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-5 shadow-sm bg-card">
            <h3 className="font-semibold mb-1">Fast evaluation</h3>
            <p className="text-sm text-muted-foreground">Paste a StreetEasy link or enter details and get a score in seconds.</p>
          </div>
          <div className="rounded-xl border p-5 shadow-sm bg-card">
            <h3 className="font-semibold mb-1">Transparent scoring</h3>
            <p className="text-sm text-muted-foreground">See how each factor contributes to the final score.</p>
          </div>
          <div className="rounded-xl border p-5 shadow-sm bg-card">
            <h3 className="font-semibold mb-1">Clean design</h3>
            <p className="text-sm text-muted-foreground">A focused interface that stays out of the way.</p>
          </div>
        </div>
      </section>
      <section id="contact" className="t-section alt" aria-labelledby="contact-title">
        <div className="t-container">
          <h2 id="contact-title" className="text-2xl font-semibold mb-2">Contact</h2>
          <p className="text-muted-foreground">Have feedback or ideas? Email <a className="underline" href="mailto:cmsechrest@gmail.com">cmsechrest@gmail.com</a>.</p>
        </div>
      </section>
    </div>
  );
};

export default Index;
