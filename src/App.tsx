import React, { useRef, useState } from "react";
import { useTacticsState } from "./hooks/useTacticsState";
import { TacticalBoard } from "./components/Pitch/TacticalBoard";
import { TopHeader } from "./components/Toolbar/TopHeader";
import { ToolSelector } from "./components/Toolbar/ToolSelector";
import { BottomQuickBar } from "./components/Toolbar/BottomQuickBar";
import { PropertiesPanel } from "./components/Sidebar/PropertiesPanel";
import { FormationsPanel } from "./components/Sidebar/FormationsPanel";
import { HelpModal } from "./components/Modal/HelpModal";
import { Shield, Sliders, ChevronRight, ChevronLeft } from "lucide-react";
import type { Player, Ball, Equipment } from "./types/tactics";
import { TEAM_COLORS } from "./constants/formations";

export function App() {
  const tactics = useTacticsState();
  const boardRef = useRef<SVGSVGElement | null>(null);

  const [activeTab, setActiveTab] = useState<"formations" | "properties">(
    "formations",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Auto-switch to properties tab when an element is selected
  React.useEffect(() => {
    if (tactics.selectedId) {
      setActiveTab("properties");
    }
  }, [tactics.selectedId]);

  // Quick Add handlers for bottom bar
  const handleAddPlayer = (
    team: "A" | "B" | "neutral" | "custom",
    isGk?: boolean,
  ) => {
    const isTeamA = team === "A";
    const isTeamB = team === "B";
    const count =
      tactics.state.players.filter((p) => p.team === team).length + 1;

    let color = TEAM_COLORS.neutral.primary;
    if (isTeamA)
      color = isGk ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamA.primary;
    else if (isTeamB)
      color = isGk ? TEAM_COLORS.teamB.gk : TEAM_COLORS.teamB.primary;

    const newPlayer: Player = {
      id: `player-${team}-${Date.now()}`,
      team,
      number: isGk ? "1" : count.toString(),
      name: isGk ? "GK" : "",
      x: isTeamA
        ? 350 + (count % 4) * 40
        : isTeamB
          ? 700 - (count % 4) * 40
          : 525,
      y: 200 + (count % 5) * 60,
      color,
      textColor: "#ffffff",
      isGoalkeeper: isGk,
      radius: 17,
      facingAngle: isTeamA ? 0 : isTeamB ? 180 : 0,
    };

    tactics.pushState((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));

    tactics.setSelectedId(newPlayer.id);
    tactics.setSelectedType("player");
    tactics.setActiveTool("select");
  };

  const handleAddBall = () => {
    const newBall: Ball = {
      id: `ball-${Date.now()}`,
      x: 525 + (Math.random() * 80 - 40),
      y: 340 + (Math.random() * 80 - 40),
      size: 11,
    };
    tactics.pushState((prev) => ({
      ...prev,
      balls: [...prev.balls, newBall],
    }));
    tactics.setSelectedId(newBall.id);
    tactics.setSelectedType("ball");
    tactics.setActiveTool("select");
  };

  const handleAddEquipment = (
    type:
      | "cone-orange"
      | "cone-yellow"
      | "cone-blue"
      | "mannequin"
      | "mini-goal",
  ) => {
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      type,
      x: 525 + (Math.random() * 80 - 40),
      y: 340 + (Math.random() * 80 - 40),
    };
    tactics.pushState((prev) => ({
      ...prev,
      equipments: [...prev.equipments, newEq],
    }));
    tactics.setSelectedId(newEq.id);
    tactics.setSelectedType("equipment");
    tactics.setActiveTool("select");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <TopHeader
        tactics={tactics}
        boardRef={boardRef}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
        {/* Left Tool Palette Sidebar */}
        <div className="bg-slate-900/95 backdrop-blur border-r border-slate-800 p-1 sm:p-2.5 flex flex-col items-center z-30 shrink-0 overflow-y-auto">
          <ToolSelector
            activeTool={tactics.activeTool}
            setActiveTool={tactics.setActiveTool}
            drawingColor={tactics.drawingColor}
            setDrawingColor={tactics.setDrawingColor}
            drawingWidth={tactics.drawingWidth}
            setDrawingWidth={tactics.setDrawingWidth}
          />
        </div>

        {/* Central Pitch Stage */}
        <main className="flex-1 flex flex-col items-center justify-between relative p-1 md:p-2 overflow-hidden bg-slate-950/80 min-h-0 min-w-0">
          <div className="flex-1 w-full h-full flex items-center justify-center min-h-0 min-w-0">
            <TacticalBoard tactics={tactics} boardRef={boardRef} />
          </div>

          {/* Bottom Quick-Add Bar */}
          <div className="w-full mt-1 z-20 shrink-0">
            <BottomQuickBar
              activeTool={tactics.activeTool}
              setActiveTool={tactics.setActiveTool}
              onAddPlayer={handleAddPlayer}
              onAddBall={handleAddBall}
              onAddEquipment={handleAddEquipment}
              onUndo={tactics.undo}
              onRedo={tactics.redo}
              canUndo={tactics.canUndo}
              canRedo={tactics.canRedo}
            />
          </div>
        </main>

        {/* Backdrop for mobile drawer */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar (Tabs for Formations / Settings vs Properties) */}
        <aside
          className={`bg-slate-900/95 backdrop-blur border-l border-slate-800 transition-all duration-300 flex flex-col z-40 shrink-0 ${
            isSidebarOpen ? "w-72 sm:w-80" : "w-0"
          } ${
            isSidebarOpen
              ? "fixed inset-y-0 right-0 h-full md:static md:h-auto shadow-2xl md:shadow-none"
              : ""
          } overflow-hidden`}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full w-72 sm:w-80">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setActiveTab("formations")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "formations"
                      ? "bg-slate-800 text-emerald-400 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Formations & Pitch
                </button>

                <button
                  onClick={() => setActiveTab("properties")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "properties"
                      ? "bg-slate-800 text-sky-400 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Properties
                  {tactics.selectedId && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {activeTab === "formations" ? (
                  <FormationsPanel tactics={tactics} />
                ) : (
                  <PropertiesPanel tactics={tactics} />
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Sidebar Toggle Handle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-l-md border-y border-l border-slate-700 shadow-md transition cursor-pointer"
        >
          {isSidebarOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;
