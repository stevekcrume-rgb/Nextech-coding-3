//Enroll APIs
import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config.js';

export class Enroll {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
  }

  //enrolls a user to a course, no documented mechanism to unenroll
  enroll(courseId, userId) {
    const payload = JSON.stringify({
      course_id: courseId,
      user_id: userId,
    });

    //debug
    //console.log(`Enrolling User ID: ${userId} to Course ID: ${courseId}`);
    const params = { ...this.params, tags: { name: 'Enrollment_Enroll' } };
    const res = http.post(`${config.apiUrl}/enroll`, payload, params);

    check(res, {
      'Enroll status is 200': (r) => r.status === 200,
    });

    // debug if enrollment fails
    // if (res.status !== 200) {
    //   console.error(`Enrollment Failed: ${res.status} ${res.body}`);
    // }

    return res;
  }
}
