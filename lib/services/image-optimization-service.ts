import { cacheService } from '@/lib/cache/cache-service';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

export class ImageOptimizationService {
  private static readonly CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
  private static readonly CACHE_TTL = 86400; // 24 hours

  // Generate optimized image URL
  static generateOptimizedUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!originalUrl) return originalUrl;

    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      fit = 'cover',
      blur,
      sharpen = false,
    } = options;

    // If using a CDN like Cloudinary or Imgix
    if (this.CDN_BASE_URL && originalUrl.includes(this.CDN_BASE_URL)) {
      return this.generateCloudinaryUrl(originalUrl, options);
    }

    // For Next.js built-in optimization
    return this.generateNextJSUrl(originalUrl, options);
  }

  // Generate Cloudinary optimized URL
  private static generateCloudinaryUrl(
    originalUrl: string,
    options: ImageOptimizationOptions
  ): string {
    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      fit = 'cover',
      blur,
      sharpen,
    } = options;

    let transformations = [];

    if (width || height) {
      const dimensions = [
        width && `w_${width}`,
        height && `h_${height}`,
        `c_${fit}`,
      ].filter(Boolean).join(',');
      transformations.push(dimensions);
    }

    if (quality !== 85) {
      transformations.push(`q_${quality}`);
    }

    if (format !== 'auto') {
      transformations.push(`f_${format}`);
    } else {
      transformations.push('f_auto');
    }

    if (blur) {
      transformations.push(`e_blur:${blur}`);
    }

    if (sharpen) {
      transformations.push('e_sharpen');
    }

    const transformString = transformations.join(',');
    return originalUrl.replace('/upload/', `/upload/${transformString}/`);
  }

  // Generate Next.js optimized URL
  private static generateNextJSUrl(
    originalUrl: string,
    options: ImageOptimizationOptions
  ): string {
    const url = new URL('/_next/image', window.location.origin);
    url.searchParams.set('url', encodeURIComponent(originalUrl));

    if (options.width) {
      url.searchParams.set('w', options.width.toString());
    }

    if (options.quality && options.quality !== 85) {
      url.searchParams.set('q', options.quality.toString());
    }

    return url.toString();
  }

  // Get responsive image sizes for different breakpoints
  static getResponsiveSizes(
    baseWidth: number,
    breakpoints: Record<string, number> = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    }
  ): string {
    const sizes = Object.entries(breakpoints)
      .sort(([, a], [, b]) => a - b)
      .map(([name, width], index, array) => {
        const isLast = index === array.length - 1;
        const imageWidth = Math.min(baseWidth, width);
        
        if (isLast) {
          return `${imageWidth}px`;
        }
        
        return `(max-width: ${width}px) ${imageWidth}px`;
      });

    return sizes.join(', ');
  }

  // Generate srcSet for responsive images
  static generateSrcSet(
    originalUrl: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1536],
    options: Omit<ImageOptimizationOptions, 'width'> = {}
  ): string {
    return widths
      .map(width => {
        const optimizedUrl = this.generateOptimizedUrl(originalUrl, {
          ...options,
          width,
        });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  }

  // Preload critical images
  static preloadImage(
    url: string,
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const optimizedUrl = this.generateOptimizedUrl(url, options);
      
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = optimizedUrl;
    });
  }

  // Batch preload images
  static async preloadImages(
    urls: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.preloadImage(url, options).catch(() => {
        console.warn(`Failed to preload image: ${url}`);
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  // Get image metadata (cached)
  static async getImageMetadata(url: string): Promise<ImageMetadata | null> {
    const cacheKey = `metadata:${url}`;
    
    // Try cache first
    const cached = await cacheService.get<ImageMetadata>(cacheKey);
    if (cached) return cached;

    try {
      const metadata = await this.fetchImageMetadata(url);
      if (metadata) {
        await cacheService.set(cacheKey, metadata, this.CACHE_TTL);
      }
      return metadata;
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }

  // Fetch image metadata from URL
  private static fetchImageMetadata(url: string): Promise<ImageMetadata | null> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const metadata: ImageMetadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: this.getImageFormat(url),
          size: 0, // Would need server-side implementation to get file size
          aspectRatio: img.naturalWidth / img.naturalHeight,
        };
        resolve(metadata);
      };
      
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // Get image format from URL
  private static getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'avif':
        return 'avif';
      case 'gif':
        return 'gif';
      default:
        return 'unknown';
    }
  }

  // Generate blur placeholder
  static generateBlurPlaceholder(
    width: number = 8,
    height: number = 8,
    color: string = '#f3f4f6'
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  // Check if image format is supported
  static isFormatSupported(format: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      return dataUrl.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  }

  // Get optimal format for browser
  static getOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.isFormatSupported('avif')) return 'avif';
    if (this.isFormatSupported('webp')) return 'webp';
    return 'jpeg';
  }

  // Performance monitoring
  static measureImageLoadTime(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        resolve(loadTime);
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }

  // Lazy loading intersection observer
  static createLazyLoadObserver(
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '100px',
      ...options,
    };

    return new IntersectionObserver((entries) => {
      entries.forEach(callback);
    }, defaultOptions);
  }
}

// Common image optimization presets
export const IMAGE_PRESETS = {
  nftCard: {
    width: 300,
    height: 300,
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  nftCardLarge: {
    width: 600,
    height: 600,
    quality: 90,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  nftThumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  nftHero: {
    width: 1200,
    height: 800,
    quality: 90,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  avatar: {
    width: 100,
    height: 100,
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;