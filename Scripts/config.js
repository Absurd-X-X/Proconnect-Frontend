
const API_BASE_URL = "https://localhost:7059/api";

const API_ROUTES = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  setupAccount: `${API_BASE_URL}/auth/setup-account`,
  updateProfessionalProfile: `${API_BASE_URL}/Professional/update-professional-profile`,
  addExperience: `${API_BASE_URL}/Professional/add-experience`,
  addEducation: `${API_BASE_URL}/Professional/add-education`,
  addCertificate: `${API_BASE_URL}/Professional/add-certificate`,
  addProject: `${API_BASE_URL}/Professional/add-project`,
  createRecruiterProfile: `${API_BASE_URL}/Recuiter/setup-recruiter-profile`,
  createCompany: `${API_BASE_URL}/Recuiter/addd-company`,
  addProfessionalSkill: `${API_BASE_URL}/Professional/add-professional-skills`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`
};