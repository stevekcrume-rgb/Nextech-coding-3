// Quiz APIs

import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config.js';

export class Quiz {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // guiz section is 1 question, indexed from 0
  getSectionQuizzes(courseId, sectionIndex) {
    const url = `${config.apiUrl}/section-quizzes?course_id=${courseId}&section_index=${sectionIndex}`;
    const params = { ...this.params, tags: { name: 'Quiz_GetSection' } };
    const res = http.get(url, params);

    check(res, {
      'Get Quizzes status is 200': (r) => r.status === 200,
      // Verify we got a valid object/array back
      'Quizzes response is valid': (r) => r.body.length > 0,
    });

    // // debug if enrollment fails
    // if (res.status !== 200) {
    //   console.error(`Quiz Failed: ${res.status} ${res.body}`);
    // }

    return res;
  }
}
