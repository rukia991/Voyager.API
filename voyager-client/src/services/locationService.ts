import api from './api';

export interface LocationDTO {
  locationID: number;
  locationName: string;
  latitude: number;
  longitude: number;
  country: string;
  isArchived?: boolean; // flag controlled by archive/restore
  archivedDate?: string;
  archivedByUserName?: string;
}

type RawLocation = Partial<LocationDTO> & {
  LocationID?: number;
  LocationName?: string;
  Latitude?: number;
  Longitude?: number;
  Country?: string;
  IsArchived?: boolean;
  ArchivedDate?: string;
  ArchivedByUserName?: string;
};

const normalizeLocation = (raw: RawLocation): LocationDTO => ({
  locationID: Number(raw.locationID ?? raw.LocationID ?? 0),
  locationName: String(raw.locationName ?? raw.LocationName ?? ''),
  latitude: Number(raw.latitude ?? raw.Latitude ?? 0),
  longitude: Number(raw.longitude ?? raw.Longitude ?? 0),
  country: String(raw.country ?? raw.Country ?? ''),
  isArchived: Boolean(raw.isArchived ?? raw.IsArchived ?? false),
  archivedDate: raw.archivedDate ?? raw.ArchivedDate,
  archivedByUserName: raw.archivedByUserName ?? raw.ArchivedByUserName,
});

const locationService = {
  getLocations: async (params?: { showArchived?: boolean }): Promise<LocationDTO[]> => {
    const response = await api.get<RawLocation[]>('/locations', { params });
    return (response.data ?? []).map(normalizeLocation);
  },
  getLocation: async (id: number): Promise<LocationDTO> => {
    const response = await api.get<RawLocation>(`/locations/${id}`);
    return normalizeLocation(response.data ?? {});
  },
  createLocation: async (location: Omit<LocationDTO, 'locationID'>): Promise<LocationDTO> => {
    const response = await api.post<LocationDTO>('/locations', location);
    return response.data;
  },
  updateLocation: async (id: number, location: LocationDTO): Promise<void> => {
    await api.put(`/locations/${id}`, location);
  },
  archiveLocation: async (id: number): Promise<void> => {
    await api.patch(`/locations/${id}/archive`);
  },

  restoreLocation: async (id: number): Promise<void> => {
    await api.patch(`/locations/${id}/restore`);
  },

  deleteLocation: async (id: number): Promise<void> => {
    await api.delete(`/locations/${id}`);
  }
};

export default locationService;
