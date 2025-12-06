import { Auth } from '../lib/Auth.js';
import { Recommendations } from '../lib/Recommendations.js';
import { config } from '../config/config.js';
import { group, check } from 'k6';

export const options = {
  scenarios: {
    recommendations_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Recommendations', () => {
    // authentication
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    // get course from recommendations
    const recService = new Recommendations(token);
    const result = recService.getRecommendations(config.userId, 48);

    // debug
    if (result.data) {
      console.log(
        `[Extracted] Course ID: ${result.data.id}, Topic ID: ${result.data.topic_id}`
      );

      check(result.data, {
        'Extracted valid Course ID': (d) => d.id !== undefined && d.id !== null,
        'Extracted valid Topic ID': (d) =>
          d.topic_id !== undefined && d.topic_id !== null,
      });
    } else {
      console.error('Failed to extract data from Recommendations response');
    }
  });
}
