import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScoreBreakdown, getScoreColor, getScoreLabel } from '@/utils/scoringAlgorithm';
import { TrendingUp, Home, GraduationCap, Building, Zap, MapPin } from 'lucide-react';

interface ScoreCardProps {
  scores: ScoreBreakdown;
  address: string;
  price: number;
}

export function ScoreCard({ scores, address, price }: ScoreCardProps) {
  const scoreItems = [
    {
      label: 'Price Value',
      score: scores.priceValue,
      icon: TrendingUp,
      description: 'Price per sq ft and fees'
    },
    {
      label: 'Location',
      score: scores.location,
      icon: MapPin,
      description: 'Walk & transit scores'
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
      description: 'Age and construction'
    },
    {
      label: 'Amenities',
      score: scores.amenities,
      icon: Zap,
      description: 'Building features'
    },
    {
      label: 'Neighborhood',
      score: scores.neighborhood,
      icon: Home,
      description: 'Local attractions'
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
              <h4 className="font-semibold mb-2">Scoring Factors:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Price per square foot analysis</li>
                <li>• Monthly maintenance fees</li>
                <li>• Walkability and transit access</li>
                <li>• School district ratings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Additional Considerations:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Floor position and building height</li>
                <li>• Building age and quality</li>
                <li>• Available amenities</li>
                <li>• Neighborhood characteristics</li>
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