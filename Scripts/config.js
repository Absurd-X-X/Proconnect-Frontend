const API_BASE_URL = "https://localhost:7059/api";

const API_ROUTES = {
  // ---- Auth ----
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  setupAccount: `${API_BASE_URL}/auth/setup-account`,

  // ---- Professional ----
  professionalProfile: `${API_BASE_URL}/Professional/profile`,
  uploadProfilePicture: `${API_BASE_URL}/Professional/upload-profile-picture`,
  updateProfessionalProfile: `${API_BASE_URL}/Professional/update-professional-profile`,
  addExperience: `${API_BASE_URL}/Professional/add-experience`,
  addEducation: `${API_BASE_URL}/Professional/add-education`,
  addCertificate: `${API_BASE_URL}/Professional/add-certificate`,
  addProject: `${API_BASE_URL}/Professional/add-project`,
  addProfessionalSkill: `${API_BASE_URL}/Professional/add-professional-skills`,

  // ---- Recruiter / Company (Module 3) ----
  // CORRECTED: real controller is RecruiterController (route api/Recruiter),
  // not CompanyController — every route below points there.
  createCompany: `${API_BASE_URL}/Recruiter`,
  joinCompany: `${API_BASE_URL}/Recruiter/join`,
  companyInvitationPreview: `${API_BASE_URL}/Recruiter/invitation`,
  inviteRecruiter: `${API_BASE_URL}/Recruiter/invite`,
  approveRecruiter: `${API_BASE_URL}/Recruiter/recruiters/approve`,
  removeRecruiter: `${API_BASE_URL}/Recruiter/recruiters`,
  updateCompanyProfile: `${API_BASE_URL}/Recruiter/profile`,
  uploadCompanyLogo: `${API_BASE_URL}/Recruiter/logo`,
  verifyCompany: `${API_BASE_URL}/Recruiter`,
  companyProfile: `${API_BASE_URL}/Recruiter`,
  companyTeam: `${API_BASE_URL}/Recruiter/team`,
  companyManagementOverview: `${API_BASE_URL}/Recruiter/management-overview`,
  recruiterProfile: `${API_BASE_URL}/Recruiter/profile`,
};