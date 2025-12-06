import { Auth } from '../lib/Auth.js';
import { Quiz } from '../lib/Quiz.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    quizzes_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Section Quizzes', () => {
    // authentication
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const quizService = new Quiz(token);

    // Pick a random course ID (28 exist) and section (sections 3-9 to avoid completing the course)
    const randomCourseId = Math.floor(Math.random() * 28) + 1;
    const sectionIndex = Math.floor(Math.random() * 7) + 3;

    quizService.getSectionQuizzes(randomCourseId, sectionIndex);
  });
}
