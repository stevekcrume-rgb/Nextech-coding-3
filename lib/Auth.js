// Authentication APIs
// For full framework we should only get one token per test unless testing login itself

import http from 'k6/http';
import { check, fail } from 'k6';
import { config } from '../config/config.js';

export class Auth {
  constructor() {
    this.loginEndpoint = `${config.apiUrl}/log_in`; //
  }

  login(email, password) {
    const loginRes = http.post(
      this.loginEndpoint,
      `grant_type=password&username=${email}&password=${password}&scope=&client_id=&client_secret=`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        tags: { name: 'Auth_Login' },
      }
    );

    // fail fast assertion
    if (
      !check(loginRes, {
        'Login successful': (r) => r.status === 200 || r.status === 201,
        'Token present': (r) => r.json('access_token') !== undefined,
      })
    ) {
      fail(`Login failed: ${loginRes.status} ${loginRes.body}`);
    }

    return loginRes.json('access_token');
  }
}
