export interface LunarSite {
  id: string;
  name: string;
  country: string;
  year: number;
  latitude: number | null;
  longitude: number | null;
}

export const lunarSites: LunarSite[] = [
  { id: "apollo-11", name: "Apollo 11", country: "USA", year: 1969, latitude: 0.67408, longitude: 23.47297 },
  { id: "apollo-12", name: "Apollo 12", country: "USA", year: 1969, latitude: -3.01239, longitude: -23.42157 },
  { id: "apollo-14", name: "Apollo 14", country: "USA", year: 1971, latitude: -3.6453, longitude: -17.4714 },
  { id: "apollo-15", name: "Apollo 15", country: "USA", year: 1971, latitude: 26.1322, longitude: 3.6339 },
  { id: "apollo-16", name: "Apollo 16", country: "USA", year: 1972, latitude: -8.9734, longitude: 15.5002 },
  { id: "apollo-17", name: "Apollo 17", country: "USA", year: 1972, latitude: 20.1908, longitude: 30.7717 },
  { id: "change-4", name: "Chang'e 4", country: "China", year: 2019, latitude: -45.4446, longitude: 177.5991 },
  { id: "chandrayaan-3", name: "Chandrayaan-3", country: "India", year: 2023, latitude: -69.373, longitude: 32.319 },
  { id: "slim", name: "SLIM", country: "Japan", year: 2024, latitude: -13.3164, longitude: 25.251 },
  { id: "im-1", name: "IM-1", country: "USA", year: 2024, latitude: -80.13, longitude: 1.44 },
  { id: "blue-ghost-1", name: "Blue Ghost 1", country: "USA", year: 2025, latitude: 18.56, longitude: 61.81 },
  { id: "im-2", name: "IM-2", country: "USA", year: 2025, latitude: null, longitude: null },
];
