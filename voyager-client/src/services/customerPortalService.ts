import api from './api';

export interface CampaignOfferDTO {
  campaignID: number;
  campaignName: string;
  description?: string;
  targetGoal?: string;
  status: string;
  imageUrl?: string;
  locationName?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  isEnrolled: boolean;
}

export interface CustomerProfileDTO {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface CustomerPreferencesDTO {
  subscribeLuxury: boolean;
  subscribeCultural: boolean;
  subscribeTropical: boolean;
  subscribeAdventure: boolean;
}

export interface CampaignFeedbackDTO {
  campaignID: number;
  rating: number;
  comment?: string;
}

const customerPortalService = {
  getOffers: async (): Promise<CampaignOfferDTO[]> => {
    const res = await api.get<CampaignOfferDTO[]>('/customerportal/offers');
    return res.data;
  },
  getProfile: async (): Promise<CustomerProfileDTO> => {
    const res = await api.get<CustomerProfileDTO>('/customerportal/profile');
    return res.data;
  },
  updateProfile: async (dto: CustomerProfileDTO): Promise<void> => {
    await api.patch('/customerportal/profile', dto);
  },
  submitFeedback: async (dto: CampaignFeedbackDTO): Promise<void> => {
    await api.post('/customerportal/feedback', dto);
  },
  enrollCampaign: async (campaignId: number): Promise<void> => {
    await api.post(`/customerportal/campaigns/${campaignId}/enroll`);
  },
};

export default customerPortalService;
