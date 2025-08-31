import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PropertyData, ScoreBreakdown, getScoreColor, getScoreLabel } from '@/utils/scoringAlgorithm';
import { TrendingUp, Home, GraduationCap, Building, Zap, MapPin, TrendingDown, Heart, ChevronDown, Calendar, DollarSign } from 'lucide-react';

interface ScoreCardProps {
  scores: ScoreBreakdown;
  address: string;
  price: number;
  propertyData?: PropertyData;
}

export function ScoreCard({ scores, address, price, propertyData }: ScoreCardProps) {
  const scoreItems = [
    {
      label: 'Price Value',
      score: scores.priceValue,
      icon: TrendingUp,
      description: 'Price per sq ft, fees, and market timing'
    },
    {
      label: 'Location',
      score: scores.location,
      icon: MapPin,
      description: 'Walk, transit, safety, and proximity scores'
    },
    {
      label: 'Schools',
      score: scores.schools,
      icon: GraduationCap,
      description: 'School district quality'
    },
    {
      label: 'Building',
      score: scores.building,
      icon: Building,
      description: 'Type, age, quality, and renovation'
    },
    {
      label: 'Amenities',
      score: scores.amenities,
      icon: Zap,
      description: 'Building features, parking, and outdoor space'
    },
    {
      label: 'Neighborhood',
      score: scores.neighborhood,
      icon: Home,
      description: 'Local attractions and bike accessibility'
    },
    {
      label: 'Market Context',
      score: scores.marketContext,
      icon: TrendingDown,
      description: 'Market trends and price history'
    },
    {
      label: 'Lifestyle',
      score: scores.lifestyle,
      icon: Heart,
      description: 'Noise level and pet-friendliness'
    }
  ];

  const overallScoreColor = getScoreColor(scores.overall);
  const overallLabel = getScoreLabel(scores.overall);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Overall Score Card */}
      <Card className="shadow-lg bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-lg text-muted-foreground">{address}</CardTitle>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className={`text-6xl font-bold text-${overallScoreColor}`}>
              {scores.overall}
            </div>
            <div className="text-left">
              <Badge variant="secondary" className={`bg-${overallScoreColor} text-${overallScoreColor}-foreground`}>
                {overallLabel}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Overall Score
              </p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-primary">
            ${price.toLocaleString()}
          </p>
        </CardHeader>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scoreItems.map((item) => {
          const Icon = item.icon;
          const scoreColor = getScoreColor(item.score);
          
          return (
            <Card key={item.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <span className={`text-xl font-bold text-${scoreColor}`}>
                    {item.score}
                  </span>
                </div>
                <Progress 
                  value={item.score * 10} 
                  className="h-2 mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>

                {/* Enhanced Market Context Details */}
                {item.label === 'Market Context' && propertyData?.priceHistoryDetails && (
                  <Collapsible className="mt-4">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center space-x-2 text-sm text-primary hover:text-primary/80 transition-colors">
                        <span>View Price History Details</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Price Change:</span>
                          <div className="flex items-center space-x-1">
                            {propertyData.priceHistoryDetails.percentageChange > 0 ? (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-green-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              propertyData.priceHistoryDetails.percentageChange > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {propertyData.priceHistoryDetails.percentageChange > 0 ? '+' : ''}
                              {propertyData.priceHistoryDetails.percentageChange.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Time Period:</span>
                          <span className="text-sm text-muted-foreground">
                            {propertyData.priceHistoryDetails.timeContext}
                          </span>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {propertyData.priceHistoryDetails.analysis}
                          </p>
                        </div>
                        
                        {propertyData.priceHistoryDetails.events && propertyData.priceHistoryDetails.events.length > 0 && (
                          <div className="pt-2 border-t border-muted-foreground/20">
                            <h5 className="text-xs font-medium mb-2">Price History Timeline:</h5>
                            <div className="space-y-1">
                              {propertyData.priceHistoryDetails.events.slice(0, 3).map((event, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-xs">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{event.date}</span>
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">${event.price.toLocaleString()}</span>
                                  <span className="text-muted-foreground">- {event.event}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Score Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How We Calculate Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Enhanced Scoring Factors:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Dynamic price benchmarking by neighborhood</li>
                <li>• Building type and construction quality analysis</li>
                <li>• Renovation year and architectural significance</li>
                <li>• Comprehensive location scoring (safety, proximity)</li>
                <li>• Parking availability and outdoor space value</li>
                <li>• Market timing and price history trends</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lifestyle & Context:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Noise level and environmental factors</li>
                <li>• Pet-friendliness for animal owners</li>
                <li>• Market conditions and negotiation potential</li>
                <li>• Total cost of ownership including taxes</li>
                <li>• Floor positioning and building dynamics</li>
                <li>• Neighborhood character and future development</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This score is an algorithmic estimate based on the provided data. 
              Consider consulting with real estate professionals for comprehensive market analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}