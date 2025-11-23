import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { chatConfig, comments } from "@/config/livestream-config";
import { Smile, Users, Heart, Gift, Send, Flower2 } from "lucide-react";

interface ChatMessage {
  id: string;
  user: string;
  initials: string;
  message: string;
  color: string;
}

const getRandomColor = () => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
};

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

export const LiveChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initialize with first few comments
    return comments.slice(0, chatConfig.visibleComments).map((comment, index) => ({
      id: `msg-initial-${index}`,
      user: comment.user,
      initials: getInitials(comment.user),
      message: comment.message,
      color: getRandomColor(),
    }));
  });
  const [inputValue, setInputValue] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const emojiIdCounter = useRef(0);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        user: "Anonymous User",
        initials: "AU",
        message: inputValue.trim(),
        color: "bg-gray-500",
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue("");
    }
  };

  const addFloatingEmoji = (emoji: string) => {
    const newEmoji: FloatingEmoji = {
      id: emojiIdCounter.current++,
      emoji,
      left: Math.random() * 60 + 20, // Random position between 20% and 80%
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);

    // Remove emoji after animation (3 seconds)
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 3000);
  };

  useEffect(() => {
    let currentIndex = chatConfig.visibleComments;
    let timeout: NodeJS.Timeout;

    const scheduleNextComment = () => {
      if (currentIndex >= comments.length) {
        // Reached the end of comments
        if (chatConfig.loopComments) {
          // Loop back to start
          currentIndex = 0;
        } else {
          // Stop adding comments
          return;
        }
      }

      const comment = comments[currentIndex];
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${currentIndex}`,
        user: comment.user,
        initials: getInitials(comment.user),
        message: comment.message,
        color: getRandomColor(),
      };

      setMessages(prev => [...prev, newMessage]);
      currentIndex++;

      // Schedule next comment
      timeout = setTimeout(scheduleNextComment, chatConfig.commentInterval * 1000);
      timeoutsRef.current.push(timeout);
    };

    // Start scheduling comments after initial interval
    timeout = setTimeout(scheduleNextComment, chatConfig.commentInterval * 1000);
    timeoutsRef.current.push(timeout);

    // Cleanup all timeouts on unmount
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* TikTok-style floating comments overlay - Mobile Optimized */}
      <div className="absolute left-0 right-0 bottom-32 z-10 px-3 pointer-events-none">
        <div className="flex flex-col gap-1 items-start max-w-[75%]">
          {messages.slice(-chatConfig.visibleComments).map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-1.5 animate-fade-in"
            >
              {/* User Avatar */}
              <div className={`w-6 h-6 rounded-full ${msg.color} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                {msg.initials}
              </div>
              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white leading-relaxed drop-shadow-lg">
                  <span className="font-semibold">{msg.user}</span>
                  <span className="font-normal ml-1">{msg.message}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Emojis Animation */}
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute bottom-32 z-15 pointer-events-none animate-float-up"
          style={{
            left: `${emoji.left}%`,
            animation: 'float-up 3s ease-out forwards',
          }}
        >
          <span className="text-3xl drop-shadow-lg">{emoji.emoji}</span>
        </div>
      ))}

      {/* TikTok-style bottom bar - Mobile Optimized */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-4 px-3 pointer-events-auto safe-area-bottom">
        {/* Input and Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Input field */}
          <form onSubmit={handleSendMessage} className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tipo..."
              className="bg-[#1A1A1A]/80 backdrop-blur-md text-white placeholder:text-gray-400 border-none rounded-full h-10 px-4 text-sm focus:bg-[#252525]/80 transition-all"
            />
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => addFloatingEmoji('😊')}
              className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform hover:scale-110"
            >
              <Smile className="w-6 h-6 text-gray-300" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform hover:scale-110">
              <Users className="w-6 h-6 text-[#00F2EA]" />
            </button>
            <button
              onClick={() => addFloatingEmoji('🌹')}
              className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform hover:scale-110"
            >
              <Flower2 className="w-6 h-6 text-[#FF0050] fill-[#FF0050]" />
            </button>
            <button
              onClick={() => addFloatingEmoji('🎁')}
              className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform hover:scale-110"
            >
              <Gift className="w-6 h-6 text-[#FF0050]" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform hover:scale-110">
              <Send className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
