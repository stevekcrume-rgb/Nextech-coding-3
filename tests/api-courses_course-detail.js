import { Auth } from '../lib/Auth.js';
import { Course } from '../lib/Course.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    course_detail_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Course Detail', () => {
    // authentication
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const courseService = new Course(token);

    // 28 courses available, for full framework, courses could be created/deleted or read from data source
    const randomCourseId = Math.floor(Math.random() * 28) + 1;

    // GET /courses/{courseId}
    courseService.getCourseDetail(randomCourseId);
  });
}
