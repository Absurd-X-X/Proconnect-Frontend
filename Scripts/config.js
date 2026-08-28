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


  // ---- Connections (Module 4 — Networking) ----
sendConnectionRequest: `${API_BASE_URL}/Connections/send-connection-request`,
acceptConnectionRequest: `${API_BASE_URL}/Connections/accept-connection-request`,
rejectConnectionRequest: `${API_BASE_URL}/Connections/reject-connection-request`,
cancelConnectionRequest: `${API_BASE_URL}/Connections/cancel-connection-request`,
removeConnection: `${API_BASE_URL}/Connections/remove-connection`,
followUser: `${API_BASE_URL}/Connections/follow-user`,
unfollowUser: `${API_BASE_URL}/Connections/unfollow-user`,
getMyConnections: `${API_BASE_URL}/Connections/my-connections`,
getReceivedRequests: `${API_BASE_URL}/Connections/received-requests`,
getSentRequests: `${API_BASE_URL}/Connections/sent-requests`,
getMyFollowers: `${API_BASE_URL}/Connections/my-followers`,
getMyFollowing: `${API_BASE_URL}/Connections/my-following`,
getConnectionSuggestions: `${API_BASE_URL}/Connections/suggestions`,


// ---- Posts (Module 5) ----
createPost: `${API_BASE_URL}/Posts/create-post`,
updatePost: `${API_BASE_URL}/Posts/update-post`,
deletePost: `${API_BASE_URL}/Posts/delete-post`,
sharePost: `${API_BASE_URL}/Posts/share-post`,
reactToPost: `${API_BASE_URL}/Posts/react`,
removeReaction: `${API_BASE_URL}/Posts/remove-reaction`,
addComment: `${API_BASE_URL}/Posts/add-comment`,
updateComment: `${API_BASE_URL}/Posts/update-comment`,
deleteComment: `${API_BASE_URL}/Posts/delete-comment`,
getFeed: `${API_BASE_URL}/Posts/feed`,
getPostById: `${API_BASE_URL}/Posts/post`,
getPostsByUser: `${API_BASE_URL}/Posts/user`,
getComments: `${API_BASE_URL}/Posts/comments`,
getUserPublicProfile: `${API_BASE_URL}/Users`,

// ---- Messaging (Module 6) ----
startConversation: `${API_BASE_URL}/Messages/start-conversation`,
createGroupConversation: `${API_BASE_URL}/Messages/create-group`,
addParticipant: `${API_BASE_URL}/Messages/add-participant`,
leaveConversation: `${API_BASE_URL}/Messages/leave-conversation`,
sendMessage: `${API_BASE_URL}/Messages/send-message`,
markConversationRead: `${API_BASE_URL}/Messages/mark-read`,
getMyConversations: `${API_BASE_URL}/Messages/conversations`,
getConversationMessages: `${API_BASE_URL}/Messages/messages`,
getConversationParticipants: `${API_BASE_URL}/Messages/participants`,
pinConversation: `${API_BASE_URL}/Messages/pin`,
unpinConversation: `${API_BASE_URL}/Messages/unpin`,
muteConversation: `${API_BASE_URL}/Messages/mute`,
unmuteConversation: `${API_BASE_URL}/Messages/unmute`,
hideConversation: `${API_BASE_URL}/Messages/hide`,
unhideConversation: `${API_BASE_URL}/Messages/unhide`,
};

