import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PropertyData } from '@/utils/scoringAlgorithm';
import { supabase } from '@/integrations/supabase/client';
import { Link, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onDataExtracted: (data: PropertyData) => void;
  onToggleManual: () => void;
}

export function UrlInput({ onDataExtracted, onToggleManual }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid StreetEasy URL",
        variant: "destructive",
      });
      return;
    }

    // Validate StreetEasy URL
    if (!url.includes('streeteasy.com')) {
      toast({
        title: "Invalid URL", 
        description: "Please enter a StreetEasy listing URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Calling scrape-streeteasy function with URL:', url);
      
      const { data, error } = await supabase.functions.invoke('scrape-streeteasy', {
        body: { url: url.trim() }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to scrape listing');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract property data');
      }

      console.log('Successfully extracted data:', data.data);
      
      toast({
        title: "Data Extracted!",
        description: "Property information has been automatically filled",
      });

      onDataExtracted(data.data);
      
    } catch (error) {
      console.error('Error extracting data:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to extract property data. Please try manual entry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Link className="h-6 w-6" />
          Auto-Fill from StreetEasy
        </CardTitle>
        <p className="text-muted-foreground">
          Paste a StreetEasy listing URL to automatically extract property details
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="streeteasy-url">StreetEasy Listing URL</Label>
            <Input
              id="streeteasy-url"
              type="url"
              placeholder="https://streeteasy.com/building/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Data...
                </>
              ) : (
                'Extract Property Data'
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onToggleManual}
              disabled={isLoading}
            >
              Manual Entry
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Example URL:</strong> https://streeteasy.com/building/41-5-avenue-new_york/1f
          </p>
        </div>
      </CardContent>
    </Card>
  );
}