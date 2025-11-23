import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, MousePointerClick, Gift, Tag, TrendingUp, Sparkles, MoreVertical, Flame, Star } from "lucide-react";
import { videoConfig, channelConfig, ctaButtonConfig, liveBannersConfig, textConfig } from "@/config/livestream-config";
import profileImg from "@/assets/images/profile.jpg";
import viewer1Img from "@/assets/images/viewer1.svg";
import viewer2Img from "@/assets/images/viewer2.svg";

interface VideoPlayerProps {
  videoId?: string;
  viewerCount?: number;
}

interface FloatingHeart {
  id: number;
  left: number;
  emoji?: string; // Optional emoji for reactions other than heart
}

// Helper function to extract YouTube video ID from URL or return ID directly
const extractYouTubeId = (input: string): string => {
  if (!input) return "";

  // If it's already just an ID (11 characters, no special chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,  // Standard & short URLs
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,                   // YouTube Shorts
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,                    // Embed URLs
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,                        // Old embed format
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no pattern matches, return the input as-is (might be an ID)
  return input;
};

// Helper function to resolve profile image path
const resolveProfileImage = (input: string): string => {
  if (!input) return "";

  // If it's already a full path (starts with /), return as-is
  if (input.startsWith("/")) {
    return input;
  }

  // If it's just a filename without extension, try common image extensions
  if (!input.includes(".")) {
    const extensions = ["jpg", "jpeg", "png", "gif", "webp"];
    // Return the first valid path (browser will try to load it)
    // We'll use .jpg as default since it's most common
    for (const ext of extensions) {
      const path = `/images/${input}.${ext}`;
      // In production, we'd check if file exists, but for now return first jpg/png attempt
      if (ext === "jpg" || ext === "png") {
        return path;
      }
    }
    return `/images/${input}.jpg`; // Default fallback
  }

  // If it has extension but no path, prepend /images/
  return `/images/${input}`;
};

// Helper function to get CTA button styles
const getCtaButtonStyles = () => {
  const config = ctaButtonConfig;

  // Determine background color
  let bgColor = "bg-white/95";
  let textColor = "text-black";
  let hoverBg = "hover:bg-white";

  if (config.color.red) {
    bgColor = "bg-red-600";
    textColor = "text-white";
    hoverBg = "hover:bg-red-700";
  } else if (config.color.blue) {
    bgColor = "bg-blue-600";
    textColor = "text-white";
    hoverBg = "hover:bg-blue-700";
  } else if (config.color.gray) {
    bgColor = "bg-gray-600";
    textColor = "text-white";
    hoverBg = "hover:bg-gray-700";
  } else if (config.color.black) {
    bgColor = "bg-black";
    textColor = "text-white";
    hoverBg = "hover:bg-gray-900";
  } else if (config.color.white) {
    bgColor = "bg-white/95";
    textColor = "text-black";
    hoverBg = "hover:bg-white";
  }

  // Determine effects
  const effects: string[] = [];
  if (config.effects.pulse) effects.push("cta-pulse");
  if (config.effects.glow) effects.push("cta-glow");
  if (config.effects.shake) effects.push("cta-shake");
  if (config.effects.bounce) effects.push("cta-bounce");
  if (config.effects.float) effects.push("cta-float");

  return {
    bgColor,
    textColor,
    hoverBg,
    effects: effects.join(" "),
  };
};

// Helper function to get CTA button icon
const getCtaButtonIcon = () => {
  const config = ctaButtonConfig;

  if (config.icon.gift) return Gift;
  if (config.icon.tag) return Tag;
  if (config.icon.trending) return TrendingUp;
  if (config.icon.sparkles) return Sparkles;

  // Default to click icon
  return MousePointerClick;
};

// Helper function to get banner icon
const getBannerIcon = (iconType: string) => {
  switch (iconType) {
    case "heart":
      return Heart;
    case "flame":
      return Flame;
    case "star":
      return Star;
    case "trending":
      return TrendingUp;
    case "sparkles":
      return Sparkles;
    default:
      return Flame;
  }
};

export const VideoPlayer = ({ videoId = videoConfig.videoId }: VideoPlayerProps) => {
  const extractedVideoId = extractYouTubeId(videoId);
  const [currentViewers, setCurrentViewers] = useState(videoConfig.viewers.initialCount);
  const [hasDropped, setHasDropped] = useState(false);
  const [showCtaButton, setShowCtaButton] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [profileImagePath, setProfileImagePath] = useState("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isInitializing = useRef(false);
  const heartIdCounter = useRef(0);

  // Set profile image from imported assets
  useEffect(() => {
    // If profileImageUrl is "profile", use the imported image
    if (channelConfig.profileImageUrl === "profile") {
      setProfileImagePath(profileImg);
      return;
    }

    const resolvedPath = resolveProfileImage(channelConfig.profileImageUrl);

    if (!resolvedPath) {
      setProfileImagePath("");
      return;
    }

    // If it's a full path, use it directly
    if (resolvedPath.includes(".") && resolvedPath.startsWith("/images/")) {
      setProfileImagePath(resolvedPath);
      return;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentViewers(prev => {
        // If already dropped, keep in configured range
        if (hasDropped) {
          const change = Math.random() > 0.5 ? 
            Math.floor(Math.random() * 5) + 1 : 
            -(Math.floor(Math.random() * 5) + 1);
          const newValue = prev + change;
          return Math.max(
            videoConfig.viewers.afterDrop.min, 
            Math.min(videoConfig.viewers.afterDrop.max, newValue)
          );
        }

        // Before the drop, keep in configured range
        const change = Math.random() > 0.5 ? 
          Math.floor(Math.random() * 15) + 1 : 
          -(Math.floor(Math.random() * 12) + 1);
        
        const newValue = prev + change;
        return Math.max(
          videoConfig.viewers.beforeDrop.min, 
          Math.min(videoConfig.viewers.beforeDrop.max, newValue)
        );
      });
    }, videoConfig.viewers.updateInterval);

    return () => clearInterval(interval);
  }, [hasDropped]);

  // CTA Button delay
  useEffect(() => {
    if (ctaButtonConfig.enabled) {
      const timeout = setTimeout(() => {
        setShowCtaButton(true);
      }, ctaButtonConfig.delayInSeconds * 1000);

      return () => clearTimeout(timeout);
    }
  }, []);

  // Banner rotation
  useEffect(() => {
    if (!liveBannersConfig.enabled || liveBannersConfig.banners.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        (prevIndex + 1) % liveBannersConfig.banners.length
      );
    }, liveBannersConfig.rotationInterval * 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-generate reactions periodically (TikTok effect)
  // Only includes emojis that users can actually send via buttons
  useEffect(() => {
    const reactions = ['❤️', '😊', '🌹', '🎁'];

    const interval = setInterval(() => {
      const random = Math.random();

      if (random > 0.5) {
        // 50% chance - add floating heart or emoji every 2 seconds
        const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];

        const newReaction: FloatingHeart = {
          id: heartIdCounter.current++,
          left: Math.random() * 60 + 20, // Random position between 20% and 80%
          emoji: randomEmoji === '❤️' ? undefined : randomEmoji, // Only set emoji if not heart
        };
        setFloatingHearts((prev) => [...prev, newReaction]);

        // Remove after animation (3 seconds)
        setTimeout(() => {
          setFloatingHearts((prev) => prev.filter((h) => h.id !== newReaction.id));
        }, 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    // Prevent duplicate initialization
    if (isInitializing.current) return;
    isInitializing.current = true;

    // Clear previous container
    container.innerHTML = '';

    const w = window as any;
    let checkInterval: any = null;
    let dropTimeout: any = null;

    const triggerDrop = () => {
      if (w.__VIEWER_DROP_DONE) return;
      w.__VIEWER_DROP_DONE = true;
      setHasDropped(true);
      const range = videoConfig.viewers.afterDrop.max - videoConfig.viewers.afterDrop.min;
      setCurrentViewers(Math.floor(Math.random() * (range + 1)) + videoConfig.viewers.afterDrop.min);
    };

    // YOUTUBE PLAYER
    if (videoConfig.videoType === "youtube") {
      const scriptId = 'youtube-iframe-api';
      
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }

      let player: any = null;

      const onPlayerReady = () => {
        checkInterval = setInterval(() => {
          if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            
            if (currentTime >= videoConfig.viewers.dropTimeInSeconds && !w.__VIEWER_DROP_DONE) {
              triggerDrop();
            }
          }
        }, 1000);
      };

      const initPlayer = () => {
        if (!w.YT || !w.YT.Player) {
          return;
        }

        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        container.appendChild(playerDiv);

        player = new w.YT.Player('youtube-player', {
          videoId: extractedVideoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: onPlayerReady,
          },
        });
      };

      if (w.YT && w.YT.Player) {
        initPlayer();
      } else {
        w.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
      }

      dropTimeout = setTimeout(() => {
        if (!w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, videoConfig.viewers.dropTimeInSeconds * 1000);

      return () => {
        isInitializing.current = false;
        if (checkInterval) clearInterval(checkInterval);
        if (dropTimeout) clearTimeout(dropTimeout);
        if (player && player.destroy) {
          player.destroy();
        }
      };
    }

    // PANDA VIDEO PLAYER
    if (videoConfig.videoType === "panda" && videoConfig.pandaEmbedCode) {
      // Create a temporary wrapper div to process the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = videoConfig.pandaEmbedCode;

      // Separate scripts from HTML
      const htmlElements = Array.from(tempDiv.children).filter(el => el.tagName !== 'SCRIPT');
      const scriptElements = tempDiv.querySelectorAll('script');

      // Add HTML elements first
      htmlElements.forEach(el => container.appendChild(el));

      // Execute scripts after (to ensure DOM is ready)
      scriptElements.forEach((oldScript) => {
        const newScript = document.createElement('script');

        // Copy attributes (src, async, defer, etc)
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy inline content
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }

        // Add to container to execute
        container.appendChild(newScript);
      });

      dropTimeout = setTimeout(() => {
        if (!w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, videoConfig.viewers.dropTimeInSeconds * 1000);

      return () => {
        isInitializing.current = false;
        if (dropTimeout) clearTimeout(dropTimeout);

        // Clean up container completely
        container.innerHTML = '';
      };
    }

    // DIRECT VIDEO LINK PLAYER
    if (videoConfig.videoType === "direct" && videoConfig.directVideoUrl) {
      const videoElement = document.createElement('video');
      videoElement.src = videoConfig.directVideoUrl;
      videoElement.controls = true;
      videoElement.autoplay = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'contain';
      videoElement.style.backgroundColor = '#000';
      
      container.appendChild(videoElement);

      checkInterval = setInterval(() => {
        const currentTime = videoElement.currentTime;
        
        if (currentTime >= videoConfig.viewers.dropTimeInSeconds && !w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, 1000);

      dropTimeout = setTimeout(() => {
        if (!w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, videoConfig.viewers.dropTimeInSeconds * 1000);

      return () => {
        isInitializing.current = false;
        if (checkInterval) clearInterval(checkInterval);
        if (dropTimeout) clearTimeout(dropTimeout);
      };
    }

    // VIMEO PLAYER
    if (videoConfig.videoType === "vimeo" && videoConfig.vimeoEmbedCode) {
      // Create a temporary wrapper div to process the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = videoConfig.vimeoEmbedCode;

      // Find the wrapper div and iframe
      const wrapperDiv = tempDiv.querySelector('div');
      const iframe = tempDiv.querySelector('iframe');
      const scriptElements = tempDiv.querySelectorAll('script');

      if (wrapperDiv && iframe) {
        // Override the wrapper styles to fit our container
        wrapperDiv.style.position = 'relative';
        wrapperDiv.style.width = '100%';
        wrapperDiv.style.height = '100%';
        wrapperDiv.style.padding = '0';

        // Make sure iframe fills the container
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Add to container
        container.appendChild(wrapperDiv);
      } else if (iframe) {
        // If there's only an iframe, add it directly with proper sizing
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.border = 'none';
        container.appendChild(iframe);
      }

      // Execute scripts after (to ensure DOM is ready)
      scriptElements.forEach((oldScript) => {
        const newScript = document.createElement('script');

        // Copy attributes (src, async, defer, etc)
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy inline content
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }

        // Add to document head to execute
        document.head.appendChild(newScript);
      });

      dropTimeout = setTimeout(() => {
        if (!w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, videoConfig.viewers.dropTimeInSeconds * 1000);

      return () => {
        isInitializing.current = false;
        if (dropTimeout) clearTimeout(dropTimeout);

        // Clean up container completely
        container.innerHTML = '';
      };
    }

    // VTURB PLAYER
    if (videoConfig.videoType === "vturb" && videoConfig.vturbScript) {
      container.innerHTML = videoConfig.vturbScript;

      const scripts = container.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      dropTimeout = setTimeout(() => {
        if (!w.__VIEWER_DROP_DONE) {
          triggerDrop();
        }
      }, videoConfig.viewers.dropTimeInSeconds * 1000);

      return () => {
        isInitializing.current = false;
        if (dropTimeout) clearTimeout(dropTimeout);
      };
    }
  }, [videoId]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <div ref={playerContainerRef} className="w-full h-full" />
      </div>

      {/* TikTok Header - Mobile Optimized */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent pb-20 pt-3 px-3 safe-area-top">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden flex-shrink-0">
              {profileImagePath ? (
                <img
                  src={profileImagePath}
                  alt={channelConfig.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#00F2EA] to-[#FF0050] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{channelConfig.initials}</span>
                </div>
              )}
            </div>

            {/* Username and viewers */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm drop-shadow-lg truncate">
                  {channelConfig.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-white fill-white" />
                <span className="text-white text-xs font-semibold">
                  {channelConfig.heartsCount}
                </span>
              </div>
            </div>

            {/* Follow Button */}
            <button className="bg-[#FE2C55] text-white font-bold text-xs px-4 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0 active:scale-95 transition-transform">
              <span className="text-base leading-none">{textConfig.followButtonSymbol}</span>
              <span>{textConfig.followButtonText}</span>
            </button>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Viewers avatars */}
            <div className="flex items-center -space-x-2">
              <img src={viewer1Img} alt="Viewer 1" className="w-6 h-6 rounded-full border-2 border-black" />
              <img src={viewer2Img} alt="Viewer 2" className="w-6 h-6 rounded-full border-2 border-black" />
            </div>

            {/* Viewer count badge */}
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
              <span className="text-white text-xs font-bold">{currentViewers.toLocaleString('en-US')}</span>
            </div>

            {/* Menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 flex-shrink-0"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Classification and Events Banner */}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          {/* Left side - Rotating Banner */}
          {liveBannersConfig.enabled && liveBannersConfig.banners.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md transition-all duration-300">
              {(() => {
                const currentBanner = liveBannersConfig.banners[currentBannerIndex];
                const IconComponent = getBannerIcon(currentBanner.icon);
                return (
                  <>
                    <IconComponent className={`w-4 h-4 ${currentBanner.iconColor}`} />
                    <span className="text-white font-semibold text-[11px]">{currentBanner.text}</span>
                  </>
                );
              })()}
            </div>
          )}

          {/* Right side - Static Banner */}
          {liveBannersConfig.rightBanner.enabled && (
            <div className="bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
              <span className="text-white font-bold text-[11px]">{liveBannersConfig.rightBanner.text}</span>
            </div>
          )}
        </div>
      </div>


      {/* TikTok Floating Hearts - Mobile Optimized */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute bottom-32 z-10 pointer-events-none animate-float-up"
          style={{
            left: `${heart.left}%`,
            animation: 'float-up 3s ease-out forwards',
          }}
        >
          {heart.emoji ? (
            <span className="text-3xl drop-shadow-lg">{heart.emoji}</span>
          ) : (
            <Heart className="w-6 h-6 fill-white/90 text-white/90 drop-shadow-lg" />
          )}
        </div>
      ))}

      {/* CTA Button - Centered */}
      {showCtaButton && ctaButtonConfig.enabled && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <a
            href={ctaButtonConfig.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`pointer-events-auto ${getCtaButtonStyles().bgColor} ${getCtaButtonStyles().textColor} ${getCtaButtonStyles().hoverBg} ${getCtaButtonStyles().effects} px-6 py-3 rounded-full font-bold text-lg shadow-2xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95`}
          >
            {(() => {
              const IconComponent = getCtaButtonIcon();
              return <IconComponent className="w-6 h-6" />;
            })()}
            <span>{ctaButtonConfig.text}</span>
          </a>
        </div>
      )}

    </div>
  );
};
