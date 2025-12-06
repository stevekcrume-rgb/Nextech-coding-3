import { Auth } from '../lib/Auth.js';
import { Course } from '../lib/Course.js';
import { config } from '../config/config.js';
import { getRandomItem } from '../utils/utils.js';
import { group, fail } from 'k6';

export const options = {
  scenarios: {
    update_progress: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Update Course Progress', () => {
    // authentication
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const courseService = new Course(token);

    // select random course
    const randomCourseId = Math.floor(Math.random() * 28) + 1;

    // not used const randomCourse = getRandomItem(courses);

    // select a random progress from [0,10,20,30,40,50,60,70,80,90]
    const progressValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; //changed from Swagger to match proxy recorded values
    const randomProgress = getRandomItem(progressValues);

    courseService.updateProgress(randomCourseId, randomProgress);
  });
}
