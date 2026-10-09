/**
 * Map Configuration & Tile Provider Helper
 * Supports Mapbox, MapTiler, CartoDB, and OpenStreetMap tiles.
 */

export const getMapTileConfig = (theme: "light" | "dark" = "dark") => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (mapboxToken) {
    const styleId = theme === "light" ? "streets-v12" : "navigation-night-v1";
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
      tileSize: 512,
      zoomOffset: -1,
    };
  }

  if (maptilerKey) {
    const styleId = theme === "light" ? "streets-v2" : "streets-v2-dark";
    return {
      url: `https://api.maptiler.com/maps/${styleId}/{z}/{x}/{y}.png?key=${maptilerKey}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    };
  }

  // Default high-availability CartoDB tiles (No API key required)
  const cartoUrl =
    theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return {
    url: cartoUrl,
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  };
};

export const PUNE_DEFAULT_COORDS: [number, number] = [18.5204, 73.8567]; // Central Pune (Deccan / FC Road)
