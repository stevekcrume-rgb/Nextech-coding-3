// MyCourses APIs
import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config.js';
import { getRandomItem } from '../utils/utils.js';

export class MyCourses {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // get enrolled courses for user
  getMyCourses(userId) {
    const url = `${config.apiUrl}/mycourses?user_id=${userId}`;
    const params = { ...this.params, tags: { name: 'MyCourses_GetList' } };
    const res = http.get(url, params);

    let body = null;
    body = res.json();

    check(res, {
      'Get MyCourses status is 200': (r) => r.status === 200,
    });

    // Use the utility to pick a random course from the list
    const randomItem = getRandomItem(body);

    // Extract and return id and topic_id
    return {
      response: res,
      data: randomItem
        ? { id: randomItem.id, topic_id: randomItem.topic_id }
        : null,
    };
  }
}
