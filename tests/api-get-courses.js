import { Auth } from '../lib/Auth.js';
import { Course } from '../lib/Course.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    get_courses: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Grouping makes the CLI output cleaner and easier to read

  const auth = new Auth();
  const token = auth.login(
    config.credentials.email,
    config.credentials.password
  );

  const courseService = new Course(token);

  courseService.getCourses();
}
