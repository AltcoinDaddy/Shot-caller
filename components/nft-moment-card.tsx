"use client"

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, Trophy, Star, Zap } from 'lucide-react';
import { NFTMoment } from '@/lib/types/nft';
import { cn } from '@/lib/utils';

interface NFTMomentCardProps {
  moment: NFTMoment;
  isSelected?: boolean;
  isInLineup?: boolean;
  onSelect?: (moment: NFTMoment) => void;
  onRemove?: (momentId: number) => void;
  disabled?: boolean;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export const NFTMomentCard: React.FC<NFTMomentCardProps> = ({
  moment,
  isSelected = false,
  isInLineup = false,
  onSelect,
  onRemove,
  disabled = false,
  showStats = true,
  compact = false,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAction = () => {
    if (disabled) return;
    
    if (isInLineup && onRemove) {
      onRemove(moment.momentId);
    } else if (onSelect) {
      setIsFlipped(true);
      onSelect(moment);
      setTimeout(() => setIsFlipped(false), 600);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'epic': return 'text-purple-500 border-purple-500/50 bg-purple-500/10';
      case 'rare': return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
      case 'common': return 'text-gray-500 border-gray-500/50 bg-gray-500/10';
      default: return 'text-gray-500 border-gray-500/50 bg-gray-500/10';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return <Trophy className="h-3 w-3" />;
      case 'epic': return <Star className="h-3 w-3" />;
      case 'rare': return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatMomentId = (id: number) => {
    return `#${id.toString().padStart(6, '0')}`;
  };

  const getPlayerStats = () => {
    if (!showStats || !moment.metadata.attributes) return null;

    const stats = moment.metadata.attributes.reduce((acc, attr) => {
      if (attr.trait_type && typeof attr.value === 'number') {
        acc[attr.trait_type] = attr.value;
      }
      return acc;
    }, {} as Record<string, number>);

    if (moment.sport === 'NBA') {
      return {
        PPG: stats['Points Per Game'] || stats['PPG'] || 0,
        RPG: stats['Rebounds Per Game'] || stats['RPG'] || 0,
        APG: stats['Assists Per Game'] || stats['APG'] || 0,
      };
    } else {
      return {
        YDS: stats['Yards'] || stats['Passing Yards'] || stats['Rushing Yards'] || stats['Receiving Yards'] || 0,
        TDs: stats['Touchdowns'] || stats['TDs'] || 0,
        RTG: stats['Rating'] || stats['Passer Rating'] || stats['REC'] || 0,
      };
    }
  };

  const playerStats = getPlayerStats();

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative overflow-hidden group transition-all duration-300 cursor-pointer",
        "hover:scale-105 hover:shadow-2xl hover:border-foreground",
        "card-3d holographic",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isInLineup && "pulse-glow",
        isFlipped && "animate-spin",
        disabled && "opacity-50 cursor-not-allowed",
        compact ? "aspect-[2/3]" : "aspect-[3/4]",
        className
      )}
      onClick={handleAction}
    >
      <div className="relative h-full">
        {/* Background Image with Lazy Loading */}
        <div className="absolute inset-0">
          {isVisible && moment.imageUrl && !imageError ? (
            <div className="relative w-full h-full">
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center animate-pulse">
                  <div className="text-center text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                    <div className="text-xs">Loading...</div>
                  </div>
                </div>
              )}
              
              <Image
                src={moment.imageUrl}
                alt={`${moment.playerName} - ${moment.collectionName}`}
                fill
                className={cn(
                  "object-cover transition-all duration-700 group-hover:scale-110",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                sizes={compact ? "(max-width: 768px) 50vw, 25vw" : "(max-width: 768px) 100vw, 33vw"}
                quality={85}
                priority={isSelected || isInLineup}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj5m1P9oj/9k="
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-xs">
                  {imageError ? "Image Error" : !isVisible ? "Loading..." : "No Image"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity group-hover:from-black/95" />
        
        {/* Scan Line Effect */}
        <div className="absolute inset-0 scan-line opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <Badge className="bg-white/20 text-white border-white/40 transition-all group-hover:bg-white/30 group-hover:scale-110 shimmer text-xs">
            {moment.sport}
          </Badge>
          <Badge className={cn(
            "transition-all group-hover:scale-110 text-xs flex items-center gap-1",
            getRarityColor(moment.rarity)
          )}>
            {getRarityIcon(moment.rarity)}
            {moment.rarity}
          </Badge>
        </div>

        {/* Moment ID */}
        <div className="absolute top-3 right-3">
          <span className="text-xs text-white/60 font-mono">
            {formatMomentId(moment.momentId)}
          </span>
        </div>

        {/* Action Button */}
        {(onSelect || onRemove) && (
          <Button
            size="icon"
            variant={isInLineup ? "destructive" : "default"}
            className={cn(
              "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300",
              "hover:scale-110",
              isInLineup ? "hover:rotate-90" : "hover:rotate-12"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            disabled={disabled}
          >
            {isInLineup ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}

        {/* Player Information */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 text-white border-white/40 transition-all group-hover:bg-white/30">
              {moment.position}
            </Badge>
            {moment.serialNumber && (
              <span className="text-xs text-white/60">
                #{moment.serialNumber}
              </span>
            )}
          </div>

          <div className={cn(
            "font-bold mb-1 transition-transform group-hover:translate-x-1",
            compact ? "text-lg" : "text-xl"
          )}>
            {moment.playerName}
          </div>
          
          <div className="text-sm text-white/80 mb-3">
            {moment.team}
          </div>

          {/* Player Stats */}
          {showStats && playerStats && !compact && (
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              {Object.entries(playerStats).map(([stat, value], index) => (
                <div
                  key={stat}
                  className="transition-all group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ transitionDelay: `${index * 75}ms` }}
                >
                  <div className="text-white/60">{stat}</div>
                  <div className="font-bold">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Collection Name */}
          <div className="text-xs text-white/50 mb-2">
            {moment.collectionName}
          </div>

          {/* Action Button (Bottom) */}
          {!compact && (onSelect || onRemove) && (
            <Button
              className={cn(
                "w-full transition-all hover:scale-105 pulse-glow relative overflow-hidden group/btn text-xs",
                isInLineup ? "bg-destructive hover:bg-destructive/90" : ""
              )}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
              disabled={disabled}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isInLineup ? (
                  <>
                    <X className="h-3 w-3 mr-2 transition-transform group-hover/btn:rotate-90" />
                    Remove from Lineup
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-2 transition-transform group-hover/btn:rotate-90" />
                    Add to Lineup
                  </>
                )}
              </span>
              <div className="absolute inset-0 shimmer" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Compact version for lineup display
export const NFTMomentCardCompact: React.FC<NFTMomentCardProps> = (props) => {
  return <NFTMomentCard {...props} compact={true} showStats={false} />;
};

// Loading skeleton
export const NFTMomentCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <Card className={cn(
      "overflow-hidden animate-pulse",
      compact ? "aspect-[2/3]" : "aspect-[3/4]"
    )}>
      <div className="relative h-full bg-muted">
        <div className="absolute top-3 left-3 space-y-1">
          <div className="h-5 w-12 bg-muted-foreground/20 rounded" />
          <div className="h-5 w-16 bg-muted-foreground/20 rounded" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-4 w-12 bg-muted-foreground/20 rounded" />
          <div className="h-6 w-32 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
          {!compact && (
            <>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="h-8 bg-muted-foreground/20 rounded" />
                <div className="h-8 bg-muted-foreground/20 rounded" />
                <div className="h-8 bg-muted-foreground/20 rounded" />
              </div>
              <div className="h-8 w-full bg-muted-foreground/20 rounded mt-3" />
            </>
          )}
        </div>
      </div>
    </Card>
  );
};