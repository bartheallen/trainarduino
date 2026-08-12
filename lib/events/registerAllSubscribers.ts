import './subscribers/learningSubscriber';
import './subscribers/progressSubscriber';
import './subscribers/memorySubscriber';
import './subscribers/recommendationSubscriber';
import './subscribers/gamificationSubscriber';
import './subscribers/profileSubscriber';
import './subscribers/dashboardSubscriber';
import './subscribers/analyticsSubscriber';
import './subscribers/aiSubscriber';
import './subscribers/socraticTutorSubscriber';

export function registerAllSubscribers() {
  // Side-effect module imports register event handlers with the global EventBus.
}
