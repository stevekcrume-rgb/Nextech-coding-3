// Workflow: Course Completion from provided video
// Other workflows can be added to scenarios folder as needed
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { Auth } from '../lib/Auth.js';
import { Users } from '../lib/Users.js';
import { Recommendations } from '../lib/Recommendations.js';
import { MyCourses } from '../lib/MyCourses.js';
import { Enroll } from '../lib/Enroll.js';
import { Course } from '../lib/Course.js';
import { Quiz } from '../lib/Quiz.js';
import { config } from '../config/config.js';
import { sleep, group, fail } from 'k6';

// determine which workload profile to run (default to smoke)
const workloadType = __ENV.WORKLOAD || 'smoke';

// scenario profiles
// defined in config.js
const scenarios = {
  // Smoke Test: 1 user, 1 run to verify application
  smoke: {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 1,
    maxDuration: '2m',
  },
  // Load Test: Ramping traffic
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: config.stages.load,
  },
  // Stress Test: Aggressive traffic
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: config.stages.stress,
  },
};

export const options = {
  thresholds: config.thresholds,
  // Dynamically select the scenario based on the ENV variable
  scenarios: {
    course_completion_workflow: scenarios[workloadType],
  },
};

export default function () {
  group('Workflow: Course Completion', () => {
    // 1. Login
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    // Initialize Services
    // API service class for the APIs used in this workflow
    const users = new Users(token);
    const recs = new Recommendations(token);
    const myCourses = new MyCourses(token);
    const enrollment = new Enroll(token);
    const course = new Course(token);
    const quiz = new Quiz(token);

    // 2. Get User Interests
    users.getInterests();

    // 3. Get Recommendations
    //const recResult = recs.getRecommendations(config.userId);
    // Extract Course ID
    // *** removed, this list is empty for the test user ***
    // if (!recResult.data || !recResult.data.id) {
    //   fail('Could not find course in recommendations. Stopping test.');
    // }
    // const courseId = recResult.data.id;
    recs.getRecommendations(config.userId);

    // 5. Get My Courses (list of enrolled courses)
    const myResult = myCourses.getMyCourses(config.userId);
    // Extract Course ID
    if (!myResult.data || !myResult.data.id) {
      fail('Could not find enrolled course. Stopping test.');
    }
    const courseId = myResult.data.id;
    // pick a random course from enrolled list
    console.log(`Target Course ID: ${courseId}`);

    // removed, application lacks unenroll API
    // 6. Enroll
    // enrollment.enroll(courseId, config.userId);

    // 7. Get My Courses (Post-Enrollment, could verify enrollment if desired)
    myCourses.getMyCourses(config.userId);

    // 8. Get Course Detail
    course.getCourseDetail(courseId);

    // 9. Update Progress (Next button)
    // repeat update_progress/sleep through progress:6
    // TODO: adjust loop count based on course structure
    for (let i = 1; i <= 6; i++) {
      group(`Reading Phase: Progress ${i * 10}%`, () => {
        course.updateProgress(courseId, i);

        // Sleep 5s
        sleep(5);
      });
    }

    // 10. Get Course Detail
    course.getCourseDetail(courseId);

    //  11. Complete Quiz sections
    // this skips 0-2 only because currently no way to reset completion, this would close the course as completed otherwise
    for (let i = 3; i <= 9; i++) {
      group('Quiz Phase', () => {
        quiz.getSectionQuizzes(courseId, i);
        course.completeCourse(courseId, i);

        // Sleep 1s
        sleep(1);
      });
    }

    //  12. Update Progress to 1
    // reset progress to 1 for re-runnable workflow if API allows
    course.updateProgress(courseId, 1);
  });
}

// Custom summary report generation
export function handleSummary(data) {
  // filename from the workload
  const filenamePrefix = `reports/${workloadType}`;

  return {
    // Write standard output to console
    stdout: textSummary(data, { indent: ' ', enableColors: true }),

    // Write text summary to file
    [`${filenamePrefix}_summary.txt`]: textSummary(data, {
      indent: ' ',
      enableColors: false,
    }),

    // Write JSON to file
    [`${filenamePrefix}_data.json`]: JSON.stringify(data),
  };
}
