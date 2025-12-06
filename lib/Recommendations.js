// Recommendations APIs

import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config.js';
import { getRandomItem } from '../utils/utils.js';

export class Recommendations {
  constructor(token) {
    this.params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // list of recommended courses for a user
  getRecommendations(userId, limit = 48) {
    const params = { ...this.params, tags: { name: 'Recommendations_Get' } };
    const url = `${config.apiUrl}/recommendations?user_id=${userId}&limit=${limit}`;
    //debug request
    //console.log(`GET ${url}`);
    const res = http.get(url, params);

    let body = null;
    body = res.json();

    //debug response
    //console.log(JSON.stringify(body));

    // try {
    //   body = res.json();
    // } catch (e) {
    //   body = []; // Fallback if parsing fails
    // }

    check(res, {
      'Recommendations status is 200': (r) => r.status === 200,
      // Check that we have a populated list
      'Response has at least 1 item': (r) =>
        Array.isArray(body) && body.length > 0,
      // Check for 'id' field
      'Items have valid IDs': (r) =>
        Array.isArray(body) && body.length > 0 && body[0].hasOwnProperty('id'),
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
