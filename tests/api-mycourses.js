import { Auth } from '../lib/Auth.js';
import { MyCourses } from '../lib/MyCourses.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    my_courses_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: My Courses', () => {
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const myCoursesService = new MyCourses(token);

    // Pass the config.userId
    myCoursesService.getMyCourses(config.userId);
  });
}
