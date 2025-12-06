// Users APIs
// for full framework, this would have more user functions

import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config.js';

export class Users {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // get list of user interests
  getInterests() {
    const params = { ...this.params, tags: { name: 'Users_GetInterests' } };
    const res = http.get(`${config.apiUrl}/users/interests`, params);

    check(res, {
      'Get Interests status is 200': (r) => r.status === 200,
      // Verify body is not empty/null
      'Interests response valid': (r) => r.body && r.body.length > 0,
    });

    return res;
  }
}
