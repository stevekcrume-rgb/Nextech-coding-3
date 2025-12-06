import { credentials } from './env.js';

// Environment-specific configurations
// not used in this assignement but can be expanded
const environments = {
  dev: {
    baseUrl: 'https://www.polanji.com',
    apiUrl: 'https://api.polanji.com', //
  },
  prod: {
    baseUrl: 'https://www.polanji.com',
    apiUrl: 'https://api.polanji.com', //
  },
};

// Default to 'dev' if not specified
const selectedEnv = __ENV.ENV || 'dev';

export const config = {
  baseUrl: environments[selectedEnv].baseUrl, //used for page loads, authentication
  apiUrl: environments[selectedEnv].apiUrl, // used for API calls
  // Credentials imported dynamically from env.js
  credentials: {
    email: credentials.email,
    password: credentials.password,
  },

  // Performance
  thresholds: {
    // Global Health
    http_req_failed: ['rate<0.10'], // Error rate < 10% (this would be much tighter for a real test)
    http_req_duration: ['p(95)<2000'], // 95% of ALL requests under 2s

    // API-level thresholds
    'http_req_duration{name:Auth_Login}': ['p(95)<2000'],
    'http_req_duration{name:Course_GetDetail}': ['p(95)<2000'],
    'http_req_duration{name:Enrollment_Enroll}': ['p(95)<2000'],
    'http_req_duration{name:Course_UpdateProgress}': ['p(95)<1000'],
    'http_req_duration{name:Course_CompleteQuiz}': ['p(95)<2000'],
    'http_req_duration{name:MyCourses_GetList}': ['p(95)<1000'],
    'http_req_duration{name:Recommendations_Get}': ['p(95)<1500'],
    'http_req_duration{name:Quiz_GetSection}': ['p(95)<1000'],
    'http_req_duration{name:Users_GetInterests}': ['p(95)<1000'],
  },

  // Standard headers
  // not used in this assignment but useful for fuller framework
  headers: {
    'Content-Type': 'application/json',
  },
  // Workload Profiles
  // can be expanded for endurance/soak, spike, etc.
  // can add test_type tags
  stages: {
    load: [
      { duration: '30s', target: 5 },
      { duration: '1m30s', target: 5 },
      { duration: '30s', target: 0 },
    ],
    stress: [
      { duration: '15s', target: 10 },
      { duration: '20s', target: 15 },
      { duration: '20s', target: 20 },
      { duration: '20s', target: 20 },
      { duration: '15s', target: 0 },
    ],
  },
  // User ID for this test scenario
  // For a full framework, this could be read from a data file so that each VU gets a unique user
  userId: 13,
};
