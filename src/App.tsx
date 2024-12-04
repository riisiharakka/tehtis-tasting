import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import Index from "./pages/Index";
import WaitingScreen from "./pages/WaitingScreen";
import HostLobby from "./pages/HostLobby";
import GameScreen from "./pages/GameScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/waiting" element={<WaitingScreen />} />
            <Route path="/host-lobby/:sessionId" element={<HostLobby />} />
            <Route path="/game/:sessionId" element={<GameScreen />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;