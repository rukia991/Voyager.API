import api from './api';

export interface LocationDTO {
  locationID: number;
  locationName: string;
  latitude: number;
  longitude: number;
  isArchived?: boolean; // flag controlled by archive/restore
}

const locationService = {
  getLocations: async (params?: { showArchived?: boolean }): Promise<LocationDTO[]> => {
    const response = await api.get<LocationDTO[]>('/locations', { params });
    return response.data;
  },
  getLocation: async (id: number): Promise<LocationDTO> => {
    const response = await api.get<LocationDTO>(`/locations/${id}`);
    return response.data;
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
