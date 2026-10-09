const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errMessage = errData.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  getHealth: () => fetchJson<{ status: string; city: string; db_connected: boolean; postgis_available: boolean; integrations: Record<string, string>; models: Record<string, string> }>("/health"),

  getPlaces: (params?: Record<string, string | number | boolean | undefined>) => {
    if (!params) return fetchJson<{ items: any[]; total: number; has_more: boolean }>("/places");
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    }
    const qs = searchParams.toString();
    return fetchJson<{ items: any[]; total: number; has_more: boolean }>(`/places${qs ? `?${qs}` : ""}`);
  },

  getPlace: (id: number) => fetchJson<any>(`/places/${id}`),

  explainPlace: (id: number) => fetchJson<any>(`/places/${id}/explain`),

  getHeritageSites: () => fetchJson<any[]>("/heritage"),

  getHeritageSite: (id: number) => fetchJson<any>(`/heritage/${id}`),

  streamHeritageStory: (id: number) => `${API_BASE}/heritage/${id}/story`,

  getReports: (params?: Record<string, string | number>) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : "";
    return fetchJson<any[]>(`/reports${qs}`);
  },

  submitReport: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to submit report");
    }
    return res.json();
  },

  voteReport: (reportId: number, value: 1 | -1) =>
    fetchJson<any>(`/reports/${reportId}/vote`, {
      method: "POST",
      body: JSON.stringify({ value }),
    }),

  getHeatmap: (params?: { hour?: number; bbox?: string }) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : "";
    return fetchJson<any[]>(`/safety/heatmap${qs}`);
  },

  getHotspots: (bucket?: string) => {
    const qs = bucket ? `?bucket=${bucket}` : "";
    return fetchJson<any[]>(`/safety/hotspots${qs}`);
  },

  getSafetyScore: (lat: number, lng: number, hour?: number) => {
    const qs = `?lat=${lat}&lng=${lng}&hour=${hour ?? 14}`;
    return fetchJson<any>(`/safety/score${qs}`);
  },

  computeSafeRoute: (body: { origin: [number, number]; destination: [number, number]; hour: number; priority: string }) =>
    fetchJson<any>("/routes/safe", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  comparePlaces: (placeIds: number[]) =>
    fetchJson<any>("/compare", {
      method: "POST",
      body: JSON.stringify({ place_ids: placeIds }),
    }),

  getWeather: () => fetchJson<any>("/insights/weather"),

  getTraffic: () => fetchJson<any>("/insights/traffic"),

  getAlerts: () => fetchJson<any>("/insights/alerts"),

  getAnalyticsSummary: () => fetchJson<any>("/analytics/summary"),
};
