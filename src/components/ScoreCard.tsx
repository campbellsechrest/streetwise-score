import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScoreBreakdown, getScoreColor, getScoreLabel, PropertyData } from '@/utils/scoringAlgorithm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Home, GraduationCap, Building, Zap, MapPin, TrendingDown, Heart } from 'lucide-react';

interface ScoreCardProps {
  scores: ScoreBreakdown;
  address: string;
  price: number;
  petFriendly?: boolean;
  catsAllowed?: boolean;
  dogsAllowed?: boolean;
  property?: PropertyData;
}

export function ScoreCard({ scores, address, price, petFriendly, catsAllowed, dogsAllowed, property }: ScoreCardProps) {
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
            <Card key={item.label} className="hover:shadow-lg transition-shadow overflow-hidden h-72">
              <CardContent className="p-6 h-full flex flex-col min-h-0">
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
                <details className="mt-3 flex-1 min-h-0 flex flex-col">
                  <summary className="cursor-pointer text-sm text-muted-foreground">Details</summary>
                  <div className="mt-3 rounded-md border bg-muted/20 p-3 overflow-hidden grow min-h-0">
                    {item.label === 'Amenities' ? (
                      <>
                        {(property?.amenities && property.amenities.length > 0) ? (
                          <div className="grid gap-1 w-full h-full overflow-y-auto overscroll-y-contain pr-1">
                            {property.amenities.map((a, idx) => (
                              <span
                                key={a+idx}
                                className="w-full inline-flex items-center rounded-sm bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No building amenities detected.</p>
                        )}
                      </>
                    ) : (
                      <div className="h-full overflow-y-auto overscroll-y-contain pr-1">
                        <Tabs defaultValue="tab1">
                          <TabsList className="flex flex-wrap gap-1 w-full h-auto items-start">
                        {item.label === 'Lifestyle' && (
                          <>
                            <TabsTrigger value="pets">Pet Policy</TabsTrigger>
                            {typeof property?.noiseLevel === 'number' && <TabsTrigger value="noise">Noise</TabsTrigger>}
                          </>
                        )}
                        {item.label === 'Price Value' && (
                          <>
                            <TabsTrigger value="pricepsf">Price/Sqft</TabsTrigger>
                            <TabsTrigger value="fees">Monthly Fees</TabsTrigger>
                            <TabsTrigger value="market">Market Time</TabsTrigger>
                          </>
                        )}
                        {item.label === 'Location' && (
                          <>
                            <TabsTrigger value="walk">Walk</TabsTrigger>
                            <TabsTrigger value="transit">Transit</TabsTrigger>
                            <TabsTrigger value="bike">Bike</TabsTrigger>
                            {typeof property?.proximityToSubway === 'number' && <TabsTrigger value="subway">Subway</TabsTrigger>}
                            {typeof property?.proximityToPark === 'number' && <TabsTrigger value="park">Park</TabsTrigger>}
                          </>
                        )}
                        {item.label === 'Schools' && (
                          <TabsTrigger value="district">District</TabsTrigger>
                        )}
                        {item.label === 'Building' && (
                          <>
                            <TabsTrigger value="type">Type</TabsTrigger>
                            <TabsTrigger value="age">Age</TabsTrigger>
                            <TabsTrigger value="floor">Floor</TabsTrigger>
                          </>
                        )}
                        {item.label === 'Neighborhood' && (
                          <TabsTrigger value="bike-acc">Bike Access</TabsTrigger>
                        )}
                        {item.label === 'Market Context' && (
                          <>
                            <TabsTrigger value="history">Price History</TabsTrigger>
                            <TabsTrigger value="days">Days on Market</TabsTrigger>
                          </>
                        )}
                          </TabsList>

                        {/* Lifestyle content */}
                        <TabsContent value="pets">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              if (petFriendly === true) {
                                if (catsAllowed === true && dogsAllowed === true) {
                                  return <Badge variant="secondary">Cats and dogs allowed</Badge>;
                                }
                                return <Badge variant="secondary">Pets allowed</Badge>;
                              }
                              if (petFriendly === false) {
                                return <Badge variant="secondary">Pets not allowed</Badge>;
                              }
                              return <Badge variant="secondary">Pet policy not specified</Badge>;
                            })()}
                          </div>
                        </TabsContent>
                        {typeof property?.noiseLevel === 'number' && (
                          <TabsContent value="noise">
                            <p className="text-sm text-muted-foreground">Reported noise level: <span className="font-medium text-foreground">{property.noiseLevel}/10</span> (lower is quieter).</p>
                          </TabsContent>
                        )}

                        {/* Price Value content */}
                        <TabsContent value="pricepsf">
                          <p className="text-sm text-muted-foreground">
                            {property?.squareFeet && property.squareFeet > 0
                              ? <>Approx. price per sq ft: <span className="font-medium text-foreground">${Math.round((price / property.squareFeet)).toLocaleString()}</span> ({property.squareFeet.toLocaleString()} ft²)</>
                              : <>Price per sq ft unavailable (no square footage provided).</>}
                          </p>
                        </TabsContent>
                        <TabsContent value="fees">
                          <p className="text-sm text-muted-foreground">Monthly fees: <span className="font-medium text-foreground">${(property?.monthlyFees ?? 0).toLocaleString()}</span>/mo</p>
                        </TabsContent>
                        <TabsContent value="market">
                          <p className="text-sm text-muted-foreground">Days on market: <span className="font-medium text-foreground">{property?.daysOnMarket ?? 0}</span></p>
                        </TabsContent>

                        {/* Location content */}
                        <TabsContent value="walk">
                          <p className="text-sm text-muted-foreground">Walk score: <span className="font-medium text-foreground">{property?.walkScore ?? 0}</span></p>
                        </TabsContent>
                        <TabsContent value="transit">
                          <p className="text-sm text-muted-foreground">Transit score: <span className="font-medium text-foreground">{property?.transitScore ?? 0}</span></p>
                        </TabsContent>
                        <TabsContent value="bike">
                          <p className="text-sm text-muted-foreground">Bike score: <span className="font-medium text-foreground">{property?.bikeScore ?? 0}</span></p>
                        </TabsContent>
                        {typeof property?.proximityToSubway === 'number' && (
                          <TabsContent value="subway">
                            <p className="text-sm text-muted-foreground">Minutes to subway: <span className="font-medium text-foreground">{property.proximityToSubway} min</span></p>
                          </TabsContent>
                        )}
                        {typeof property?.proximityToPark === 'number' && (
                          <TabsContent value="park">
                            <p className="text-sm text-muted-foreground">Minutes to park: <span className="font-medium text-foreground">{property.proximityToPark} min</span></p>
                          </TabsContent>
                        )}

                        {/* Schools content */}
                        <TabsContent value="district">
                          <p className="text-sm text-muted-foreground">School district: <span className="font-medium text-foreground">{property?.schoolDistrict || 'Unknown'}</span></p>
                        </TabsContent>

                        {/* Building content */}
                        <TabsContent value="type">
                          <p className="text-sm text-muted-foreground">Building type: <span className="font-medium text-foreground">{property?.buildingType || 'Other'}</span></p>
                        </TabsContent>
                        <TabsContent value="age">
                          <p className="text-sm text-muted-foreground">Building age: <span className="font-medium text-foreground">{property?.buildingAge ?? 0}</span> years</p>
                        </TabsContent>
                        <TabsContent value="floor">
                          <p className="text-sm text-muted-foreground">Floor: <span className="font-medium text-foreground">{property?.floor ?? 0}</span> / {property?.totalFloors ?? 0}</p>
                        </TabsContent>

                        {/* Neighborhood content */}
                        <TabsContent value="bike-acc">
                          <p className="text-sm text-muted-foreground">Bike accessibility score: <span className="font-medium text-foreground">{property?.bikeScore ?? 0}</span></p>
                        </TabsContent>

                        {/* Market context content */}
                        <TabsContent value="history">
                          <p className="text-sm text-muted-foreground">Price history: <span className="font-medium text-foreground">{property?.priceHistory || 'stable'}</span></p>
                        </TabsContent>
                        <TabsContent value="days">
                          <p className="text-sm text-muted-foreground">Days on market: <span className="font-medium text-foreground">{property?.daysOnMarket ?? 0}</span></p>
                        </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                </details>
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
