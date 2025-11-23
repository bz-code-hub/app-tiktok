import { VideoPlayer } from "@/components/VideoPlayer";
import { LiveChat } from "@/components/LiveChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Mobile-optimized full-screen container */}
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden touch-none">
        <VideoPlayer />
        <LiveChat />
      </div>
    </div>
  );
};

export default Index;
