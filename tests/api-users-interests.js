import { Auth } from '../lib/Auth.js';
import { Users } from '../lib/Users.js';
import { config } from '../config/config.js';
import { group } from 'k6';

export const options = {
  scenarios: {
    users_interests: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  group('API Test: User Interests', () => {
    const auth = new Auth();
    const token = auth.login(
      config.credentials.email,
      config.credentials.password
    );

    const usersService = new Users(token);
    usersService.getInterests();
  });
}
