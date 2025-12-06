// Course APIs
//

import http from 'k6/http';
import { check, fail } from 'k6';
import { config } from '../config/config.js';
//import { getRandomItem } from "../utils/utils.js";

export class Course {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
  }

  // Get List of Courses
  getCourses() {
    const params = { ...this.params, tags: { name: 'Course_GetList' } };
    const res = http.get(`${config.apiUrl}/courses`, params);
    check(res, {
      'Get Courses status is 200': (r) => r.status === 200,
    });
    return res;
  }

  // Get Course Detail "Full Course"
  getCourseDetail(courseId) {
    const params = { ...this.params, tags: { name: 'Course_GetDetail' } };
    const res = http.get(`${config.apiUrl}/courses/${courseId}`, params);

    check(res, {
      'Get Course Detail status is 200': (r) => r.status === 200,
    });
    return res;
  }

  // Update Progress
  // this is the pagination mechanism for course content "Next"
  updateProgress(courseId, progress) {
    const params = { ...this.params, tags: { name: 'Course_UpdateProgress' } };
    const payload = JSON.stringify({
      course_id: courseId,
      user_id: config.userId, // Explicitly adding user_id, not in Swagger
      progress: progress,
    });

    const res = http.put(
      `${config.apiUrl}/courses/update_progress`,
      payload,
      params
    );

    //debug
    //console.log(`Update Progress Status: ${res.status} | Body: ${res.body}`);

    check(res, {
      'Update Progress status is 200': (r) => r.status === 200,
    });
    return res;
  }

  // Complete Course Quiz
  // changes each of 10 quiz sections to "true", there is no documented mechanism to reset quizzes
  completeCourse(courseId, section) {
    const params = { ...this.params, tags: { name: 'Course_CompleteQuiz' } };
    const res = http.post(
      `${config.apiUrl}/courses/${courseId}/sections/${section}/quiz-complete`,
      null,
      params
    );

    check(res, {
      'Complete Quiz status is 200': (r) => r.status === 200,
    });
    return res;
  }
}
