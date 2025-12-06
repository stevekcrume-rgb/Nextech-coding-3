import { Auth } from '../lib/Auth.js';
import { Enroll } from '../lib/Enroll.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    enroll_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Enroll', () => {
    // authentication
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const enrollService = new Enroll(token);

    // random course
    const randomCourseId = Math.floor(Math.random() * 28) + 1;

    // POST /enroll
    enrollService.enroll(randomCourseId, config.userId);
  });
}
