export interface BuildingData {
  id: number;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

export function generateProceduralBuildings(count = 140, isMobile = false): BuildingData[] {
  const actualCount = isMobile ? 60 : count;
  const buildings: BuildingData[] = [];
  const palette = ["#16203A", "#1D2B4D", "#1A2644", "#243358", "#2A3C68", "#1E2A47"];

  const gridSize = Math.ceil(Math.sqrt(actualCount));
  const spacing = 1.6;
  const half = (gridSize * spacing) / 2;

  let id = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (id >= actualCount) break;

      // Create avenue gaps
      if (i % 4 === 0 || j % 4 === 0) continue;

      const posX = i * spacing - half + (Math.random() - 0.5) * 0.3;
      const posZ = j * spacing - half + (Math.random() - 0.5) * 0.3;

      // Distance from center determines height trend
      const distFromCenter = Math.sqrt(posX * posX + posZ * posZ);
      const baseHeight = Math.max(0.6, 4.2 - distFromCenter * 0.35 + Math.random() * 2.2);
      const width = 0.9 + Math.random() * 0.4;
      const depth = 0.9 + Math.random() * 0.4;

      buildings.push({
        id: id++,
        position: [posX, baseHeight / 2, posZ],
        size: [width, baseHeight, depth],
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }

  return buildings;
}
