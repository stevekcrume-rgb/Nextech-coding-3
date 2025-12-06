import { Auth } from '../lib/Auth.js';
import { Topic } from '../lib/Topic.js';
import { config } from '../config/config.js';
import { getRandomItem } from '../utils/utils.js';
import { group, fail } from 'k6';

export const options = {
  scenarios: {
    topic_courses_check: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: Topic Courses', () => {
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );
    const topicService = new Topic(token);

    // Dynamic Correlation: Get list of topics first
    const topicsRes = topicService.getTopics();
    const topics = topicsRes.json();

    if (!topics || topics.length === 0) {
      fail('No topics found');
    }

    // Pick a random topic to test
    const randomTopic = getRandomItem(topics);

    // Test the specific endpoint
    topicService.getCoursesByTopic(randomTopic.id);
  });
}
