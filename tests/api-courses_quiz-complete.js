import { Auth } from '../lib/Auth.js';
import { Course } from '../lib/Course.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
    scenarios: {
        quiz_complete_check: {
            executor: 'shared-iterations',
            vus: 1,
            iterations: 1,
        },
    },
};

export default function () {
    group('API Test: Complete Quiz', () => {
        // authentication
        const auth = new Auth();
        const token = auth.login(config.credentials.email, config.credentials.password);

        const courseService = new Course(token);

        // Generate a random course ID between 1 and 28
        const randomCourseId = Math.floor(Math.random() * 28) + 1;
        
        // Default to section 0 (first section)
        const sectionIndex = 0;

        // POST /courses/{id}/sections/{section}/quiz-complete
        courseService.completeCourse(randomCourseId, sectionIndex);
    });
}