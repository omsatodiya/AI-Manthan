export interface UserInfo {
  id: string;
  userId: string;
  tenantId?: string | null;
  role?: string | null;
  organizationType?: string | null;
  businessStage?: string | null;
  teamSize?: string | null;
  industry?: string[] | null;
  goals?: string[] | null;
  opportunityType?: string[] | null;
  focusAreas?: string[] | null;
  collabTarget?: string[] | null;
  collabType?: string[] | null;
  partnershipOpen?: string | null;
  templateType?: string[] | null;
  templateTone?: string | null;
  templateAutomation?: string | null;
  eventType?: string[] | null;
  eventScale?: string | null;
  eventFormat?: string[] | null;
  createdAt: string;
  updatedAt: string;
}
