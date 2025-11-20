"use client";

import { useState, useRef, useEffect } from "react";

interface BoothData {
  code: string;
  type: string;
  rotation: number;
  points: Array<{ x: string; y: string }>;
  pointsPercent: Array<{ x: string; y: string }>;
}

interface Booth {
  code: string;
  title: string;
  description: string;
  category: string;
  color: string;
  centerX: number;
  centerY: number;
}

const boothDescriptions: Record<
  string,
  { title: string; description: string }
> = {
  "A-01": {
    title: "IoT for Monitoring",
    description: "Real-time energy monitoring system",
  },
  "A-02": {
    title: "Smart Pot",
    description: "Intelligent plant monitoring device",
  },
  "B-01": {
    title: "Health Monitor Band",
    description: "Wearable vital signs tracker",
  },
  "C-01": {
    title: "Safety Alert System",
    description: "Emergency notification platform",
  },
  "D-01": {
    title: "Crop Monitor System",
    description: "IoT sensor network for crops",
  },
  "D-02": {
    title: "H.A.R.V.E.S.T",
    description: "Humidity-based And Regulation for Vegetation, Environment, Soil, and Temperature",
  },
  "E-01": {
    title: "Air Quality Monitor",
    description: "Real-time pollution monitoring",
  },
  "F-01": {
    title: "Heritage Database",
    description: "Digital archive of artifacts",
  },
};

const CATEGORIES = [
  { code: "A", color: "#FFD700", label: "Smart Grid and Energy Management / SDG-7" },
  { code: "B", color: "#87CEEB", label: "Wearable Health and Diagnosis / SDG-3" },
  { code: "C", color: "#90EE90", label: "Public Safe and Culture / SDG-11" },
  { code: "D", color: "#DDA0DD", label: "Smart Agriculture and Aquaculture / SDG-12" },
  { code: "E", color: "#FFB6C1", label: "Climate and Waste Management / SDG-12" },
  { code: "F", color: "#FFD700", label: "National Heritage and Conservation / SDG-15" },
];

// Booth position data (imported from booth-positions.json)
const rawBoothData: BoothData[] = [
  {
    code: "C-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "74.76", y: "96.20" },
      { x: "74.76", y: "96.20" },
    ],
    pointsPercent: [
      { x: "12.46", y: "19.24" },
      { x: "12.46", y: "19.24" },
    ],
  },
  {
    code: "A-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "220.76", y: "101.03" },
      { x: "241.76", y: "125.03" },
    ],
    pointsPercent: [
      { x: "36.79", y: "20.21" },
      { x: "40.29", y: "25.01" },
    ],
  },
  {
    code: "B-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "148.76", y: "102.20" },
      { x: "169.76", y: "127.20" },
    ],
    pointsPercent: [
      { x: "24.79", y: "20.44" },
      { x: "28.29", y: "25.44" },
    ],
  },
  {
    code: "D-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "104.76", y: "256.03" },
      { x: "125.76", y: "285.03" },
    ],
    pointsPercent: [
      { x: "17.46", y: "51.21" },
      { x: "20.96", y: "57.01" },
    ],
  },
  {
    code: "E-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "224.76", y: "282.20" },
      { x: "247.76", y: "310.20" },
    ],
    pointsPercent: [
      { x: "37.46", y: "56.44" },
      { x: "41.29", y: "62.04" },
    ],
  },
  {
    code: "F-01",
    type: "rect",
    rotation: 0,
    points: [
      { x: "308.76", y: "384.20" },
      { x: "332.76", y: "412.20" },
    ],
    pointsPercent: [
      { x: "51.46", y: "76.84" },
      { x: "55.46", y: "82.44" },
    ],
  },
];

export default function BoothMapInteractive() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [boothData, setBoothData] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // (rawBoothData is defined at module scope to avoid recreating on every render)

  useEffect(() => {
    const img = new Image();
    img.src = "/map.png";
    img.onload = () => setMapImage(img);
  }, []);

  // Process booth data
  useEffect(() => {
    if (!mapImage) return;

    let cancelled = false;

    const processSource = (source: any[]) => {
      const processedBooths: Booth[] = [];
      const boothCenters: Record<string, { x: number; y: number; count: number }> = {};

      source.forEach((item: any) => {
        const category = String(item.code || "")[0] || "";
        const categoryData = CATEGORIES.find((c) => c.code === category);

        // choose pointsPercent if present, otherwise try points
        const pts = (item.pointsPercent && item.pointsPercent.length)
          ? item.pointsPercent
          : item.points;

        if (!pts || pts.length === 0) return;

        if (!boothCenters[item.code]) boothCenters[item.code] = { x: 0, y: 0, count: 0 };

        pts.forEach((p: any) => {
          // p.x/p.y may be strings or numbers and may be percent (0-100) or px depending on source
          let px = Number(p.x);
          let py = Number(p.y);

          // Heuristic: if percent-looking (<=100 and contains decimal) treat as percent of viewBox
          const isPercent = Math.abs(px) <= 100 && Math.abs(py) <= 100;
          let x = 0;
          let y = 0;
          if (isPercent) {
            // Map percent -> canvas pixel (design is 600x500, canvas is 600x500)
            const viewW = 600;
            const viewH = 500;
            x = (px / 100) * viewW;
            y = (py / 100) * viewH;
          } else {
            // assume px is already in canvas space (design matches canvas)
            x = px;
            y = py;
          }

          boothCenters[item.code].x += x;
          boothCenters[item.code].y += y;
          boothCenters[item.code].count += 1;
        });
      });

      Object.entries(boothCenters).forEach(([code, data]) => {
        const category = code.charAt(0);
        const categoryData = CATEGORIES.find((c) => c.code === category);
        const descData = boothDescriptions[code] || { title: code, description: "Booth" };

        processedBooths.push({
          code,
          title: descData.title,
          description: descData.description,
          category,
          color: categoryData?.color || "#FFFFFF",
          centerX: data.x / data.count,
          centerY: data.y / data.count,
        });
      });

      if (!cancelled) setBoothData(processedBooths);
    };

    // Try to fetch public JSON; fall back to embedded rawBoothData if fetch fails
    fetch("/booth-positions.json")
      .then((r) => {
        if (!r.ok) throw new Error("no json");
        return r.json();
      })
      .then((json) => {
        if (Array.isArray(json) && json.length) processSource(json);
        else processSource(rawBoothData as any);
      })
      .catch(() => {
        processSource(rawBoothData as any);
      });

    return () => {
      cancelled = true;
    };
  }, [mapImage]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Draw booths with transparency (no visual markers)
    // boothData.forEach((booth) => {
    //   const isSelected = selectedBooth?.code === booth.code;
    //   // Draw label only (fully transparent markers)
    //   ctx.fillStyle = isSelected ? "#000" : "#666";
    //   ctx.font = isSelected ? "bold 10px Arial" : "bold 9px Arial";
    //   ctx.textAlign = "center";
    //   ctx.textBaseline = "middle";
    //   ctx.fillText(booth.code, booth.centerX, booth.centerY);
    // });
  }, [boothData, mapImage, selectedBooth]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find clicked booth
    const clicked = boothData.find((booth) => {
      const dist = Math.hypot(booth.centerX - x, booth.centerY - y);
      return dist < 15;
    });

    if (clicked) {
      setSelectedBooth(clicked);
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hoveredBooth = boothData.find((booth) => {
      const dist = Math.hypot(booth.centerX - x, booth.centerY - y);
      return dist < 15;
    });

    canvasRef.current.style.cursor = hoveredBooth ? "pointer" : "default";
    setMousePos({ x, y });
  };

  const filteredBooths = selectedCategory
    ? boothData.filter((b) => b.category === selectedCategory)
    : boothData;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          GIK Booth Interactive Map
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
          Click to view details
        </p>

        <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-400 rounded-2xl p-3 md:p-4 overflow-hidden shadow-sm">
              <div className="relative w-full" style={{ paddingBottom: '83.33%' }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={500}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMove}
                  className="absolute inset-0 w-full h-full border border-gray-400 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <div className="bg-white border border-gray-400 rounded-xl p-3 md:p-4 mb-4 shadow-sm">
              <label className="text-sm text-gray-800 block mb-3 font-medium">
                Category Filter
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    selectedCategory === null
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 border border-gray-400 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.code}
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                      selectedCategory === cat.code
                        ? "border-2"
                        : "border border-gray-400"
                    }`}
                    style={{
                      backgroundColor:
                        selectedCategory === cat.code
                          ? `${cat.color}20`
                          : "transparent",
                      borderColor:
                        selectedCategory === cat.code ? cat.color : undefined,
                      color: selectedCategory === cat.code ? cat.color : "#374151",
                    }}
                  >
                    {cat.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Booth Details */}
            <div className="bg-white border border-gray-400 rounded-xl p-3 md:p-4 h-fit lg:sticky lg:top-24 shadow-sm">
              {selectedBooth ? (
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 md:w-5 md:h-5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedBooth.color }}
                      ></div>
                      <span className="text-lg md:text-xl font-semibold text-gray-800">
                        {selectedBooth.code}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                      {selectedBooth.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      {
                        CATEGORIES.find(
                          (c) => c.code === selectedBooth.category
                        )?.label
                      }
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-2 md:p-3">
                    <p className="text-gray-800 text-sm">
                      {selectedBooth.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-100 border border-gray-400 rounded p-2">
                      <div className="text-gray-700 mb-1 font-medium">Code</div>
                      <div className="font-bold text-gray-800">
                        {selectedBooth.code}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-400 rounded p-2">
                      <div className="text-gray-700 mb-1 font-medium">Position</div>
                      <div className="font-bold text-gray-800">
                        ({selectedBooth.centerX.toFixed(0)},{" "}
                        {selectedBooth.centerY.toFixed(0)})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBooth(null)}
                    className="w-full bg-gray-800 text-white py-2 rounded font-semibold text-sm hover:bg-gray-700 transition-all"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <div className="text-2xl md:text-3xl mb-3">👆</div>
                  <p className="text-gray-700 text-sm">
                    Click on a booth to view details
                  </p>
                  <p className="text-gray-600 text-xs mt-4">
                    Total: {boothData.length} booths
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booth Grid */}
        <div className="mt-6 md:mt-8 bg-white border border-gray-400 rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
            All Booths ({filteredBooths.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredBooths.map((booth) => (
              <div
                key={booth.code}
                onClick={() => setSelectedBooth(booth)}
                className={`bg-gray-50 border rounded-lg p-2 md:p-3 cursor-pointer transition-all hover:scale-105 ${
                  selectedBooth?.code === booth.code
                    ? "border-2 shadow-md"
                    : "border-gray-400 hover:border-gray-500"
                }`}
                style={{
                  borderColor:
                    selectedBooth?.code === booth.code
                      ? booth.color
                      : undefined,
                  boxShadow:
                    selectedBooth?.code === booth.code
                      ? `0 0 12px ${booth.color}40`
                      : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: booth.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800">
                      {booth.code}
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {booth.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
