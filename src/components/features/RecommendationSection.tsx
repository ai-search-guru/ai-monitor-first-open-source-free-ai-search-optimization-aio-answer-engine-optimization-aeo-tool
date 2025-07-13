'use client'
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Star, Clock, ArrowRight } from 'lucide-react';
import Card from '@/components/shared/Card';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  imageUrl?: string;
  readTime?: string;
  rating?: number;
}

interface RecommendationSectionProps {
  title?: string;
  recommendations: Recommendation[];
  expandable?: boolean;
  defaultExpanded?: boolean;
}

export default function RecommendationSection({
  title = "AI Recommendations",
  recommendations,
  expandable = true,
  defaultExpanded = false
}: RecommendationSectionProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/20';
      case 'medium':
        return 'bg-[#764F94]/10 text-[#764F94] border-[#764F94]/20';
      case 'low':
        return 'bg-[#00B087]/10 text-[#00B087] border-[#00B087]/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  return (
    <Card variant="elevated" className="overflow-hidden bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-6 ${expandable ? 'cursor-pointer' : ''}`}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-[#6F42C1] to-[#5A2D91] rounded-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm">
              {recommendations.length} personalized suggestions
            </p>
          </div>
        </div>
        
        {expandable && (
          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {(!expandable || isExpanded) && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="group bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-black/25 hover:border-accent transition-all duration-300 cursor-pointer"
              >
                {/* Priority badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority} priority
                  </span>
                  {rec.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-[#764F94] fill-current" />
                      <span className="text-muted-foreground text-xs">{rec.rating}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h4 className="text-foreground font-semibold text-sm mb-2 line-clamp-2">
                    {rec.title}
                  </h4>
                  <p className="text-muted-foreground text-xs line-clamp-3">
                    {rec.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#000C60] font-medium">{rec.category}</span>
                    {rec.readTime && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{rec.readTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-[#000C60] transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* View more button */}
          <div className="mt-6 text-center">
            <button className="text-[#000C60] hover:text-[#000C60] text-sm font-medium transition-colors">
              View all recommendations →
            </button>
          </div>
        </div>
      )}
    </Card>
  );
} 