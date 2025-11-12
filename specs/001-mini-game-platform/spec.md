# Feature Specification: Mini-Game Aggregation Platform

**Feature Branch**: `001-mini-game-platform`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "Create a mini-program platform that supports mini-game aggregation, points incentives, membership privileges, and viral sharing, enabling one-stop access to multiple mini-games, social viral spread, and sustainable operation."

## Clarifications

### Session 2025-11-12

- Q: How do users authenticate and register on the platform? → A: Multiple authentication methods (phone/SMS, WeChat/QQ, email) combined with full account system (username/email + password, optional social login)
- Q: How long should user data be retained and how should account deletion be handled? → A: Tiered retention: active data retained, inactive user data deleted after 3 years, complete deletion within 30 days after account deletion
- Q: What rate limiting and anti-fraud measures should be implemented? → A: Minimal restrictions: basic frequency checks only for points and invitation features
- Q: What are the offline game storage quotas for different user types? → A: Tiered quotas: free users 1GB, members 5GB, offline members 20GB
- Q: How should payment failures and refunds be handled? → A: Standard policy: automatic retry 3 times for failed payments, refunds follow platform rules (Apple 7 days, WeChat/Alipay per agreement), automatic processing

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Play Mini-Games (Priority: P1)

Users can discover, browse, and play multiple mini-games from a unified platform without leaving the application. The platform displays games in organized categories with search and filtering capabilities, allowing users to quickly find games that match their interests.

**Why this priority**: This is the core value proposition - without the ability to browse and play games, the platform has no foundation. This story delivers immediate value to users and enables all other features.

**Independent Test**: Can be fully tested by allowing a user to browse the game catalog, view game details, and launch a game. The test delivers value by providing access to entertainment content.

**Acceptance Scenarios**:

1. **Given** a user opens the platform, **When** they view the game list page, **Then** they see multiple games organized by categories (recommended, popular, latest)
2. **Given** a user is viewing the game list, **When** they click on a game card, **Then** they see detailed game information including description, cover image, and play button
3. **Given** a user is viewing game details, **When** they click the play button, **Then** the game loads and they can interact with it
4. **Given** a user wants to find a specific game, **When** they use the search function, **Then** they see relevant games matching their search query
5. **Given** a user is browsing games, **When** they scroll down, **Then** more games load automatically (infinite scroll or pagination)

---

### User Story 2 - Earn and Manage Points (Priority: P1)

Users can earn points through various activities (playing games, watching ads, daily check-ins, sharing) and use points to redeem rewards. The system tracks point balance and transaction history, providing transparency and motivation for continued engagement.

**Why this priority**: Points incentives are critical for user retention and engagement. This story enables the sustainable operation model by creating a reward loop that encourages daily usage.

**Independent Test**: Can be fully tested by having a user complete point-earning activities (play a game, watch an ad, check in) and verify points are credited, then redeem points for a reward. The test delivers value by providing tangible incentives for platform usage.

**Acceptance Scenarios**:

1. **Given** a user plays a mini-game for the minimum required duration, **When** they exit the game, **Then** they receive points based on the game's point rules
2. **Given** a user views the points page, **When** they see available point tasks, **Then** they can see task descriptions, point rewards, and completion status
3. **Given** a user completes a point task (e.g., watch ad, daily check-in), **When** the task is completed, **Then** points are immediately credited to their account
4. **Given** a user has accumulated points, **When** they view the redemption center, **Then** they see available rewards and required point amounts
5. **Given** a user selects a reward to redeem, **When** they confirm the redemption, **Then** points are deducted and the reward is delivered
6. **Given** a user wants to track their point activity, **When** they view their point history, **Then** they see all point transactions (earned and spent) with timestamps

---

### User Story 3 - Membership Subscription and Privileges (Priority: P2)

Users can subscribe to membership plans that provide exclusive benefits such as ad-free experience, point multipliers, priority access to new games, and cloud save functionality. Membership status is clearly displayed and automatically applied to user experience.

**Why this priority**: Membership provides a sustainable revenue stream and enhances user experience for paying customers. While not required for MVP, it's essential for the business model and should be implemented early to establish the premium tier.

**Independent Test**: Can be fully tested by having a user purchase a membership, verify privileges are activated (no ads, point multiplier), and confirm membership status is displayed. The test delivers value by providing premium features and revenue generation.

**Acceptance Scenarios**:

1. **Given** a user views the membership page, **When** they see available membership plans, **Then** they can view plan details, pricing, and benefits
2. **Given** a user selects a membership plan, **When** they complete the payment process, **Then** membership is activated and privileges are immediately available
3. **Given** a user has an active membership, **When** they play games, **Then** they do not see ads and receive point multipliers
4. **Given** a user has an active membership, **When** they view new games, **Then** they have priority access before non-members
5. **Given** a user's membership is about to expire, **When** they view their account, **Then** they see expiration date and renewal options
6. **Given** a user's membership expires, **When** they use the platform, **Then** they return to free tier experience (ads return, no point multipliers)

---

### User Story 4 - Invite Friends and Viral Sharing (Priority: P2)

Users can invite friends to join the platform through shareable links or QR codes. When invited friends register and complete activities, the inviter receives rewards. The system tracks invitation relationships and provides visibility into invitation progress and rewards.

**Why this priority**: Viral sharing is essential for organic growth and user acquisition. This story enables social viral spread which is a key differentiator for sustainable operation without heavy marketing spend.

**Independent Test**: Can be fully tested by having a user generate an invitation link, share it with a friend who registers, and verify both users receive appropriate rewards. The test delivers value by enabling user acquisition through social networks.

**Acceptance Scenarios**:

1. **Given** a user wants to invite friends, **When** they access the invitation feature, **Then** they can generate a unique invitation link or QR code
2. **Given** a user has an invitation link, **When** they share it via social media or messaging, **Then** recipients can click the link to register
3. **Given** a new user registers via an invitation link, **When** they complete registration, **Then** the inviter receives a reward notification
4. **Given** an invited user completes specified activities (e.g., play first game, earn first points), **When** they reach milestones, **Then** the inviter receives additional rewards
5. **Given** a user has invited multiple friends, **When** they view their invitation dashboard, **Then** they see invitation count, reward status, and leaderboard ranking
6. **Given** a user wants to track their invitation progress, **When** they view invitation details, **Then** they see which friends registered, their activity status, and pending rewards

---

### User Story 5 - Personalized Game Recommendations (Priority: P2)

Users receive personalized game recommendations based on their gaming behavior, preferences, and user profile. The system analyzes user interactions to suggest games that match their interests, improving discovery and engagement.

**Why this priority**: Personalized recommendations significantly improve user experience and engagement. This feature increases game discovery efficiency and user retention by showing relevant content.

**Independent Test**: Can be fully tested by having a user play several games, then viewing the personalized recommendation section to verify games match their interests. The test delivers value by reducing search time and increasing game discovery.

**Acceptance Scenarios**:

1. **Given** a user has played multiple games, **When** they view the recommendation section, **Then** they see games personalized based on their play history
2. **Given** a user views games by scenario (commute, break time, bedtime), **When** they select a scenario, **Then** they see games appropriate for that context
3. **Given** a user's gaming preferences change, **When** they interact with different game types, **Then** recommendations update to reflect new preferences
4. **Given** a user wants to see why a game was recommended, **When** they view recommendation details, **Then** they see the reason (similar to played games, popular among similar users, etc.)

---

### User Story 6 - Social Features and Friend Interactions (Priority: P3)

Users can add friends, view friend activity, compete on leaderboards, and interact within game communities. Social features enhance engagement through competition and collaboration.

**Why this priority**: Social features increase user retention and session duration. While not critical for MVP, they significantly enhance the platform's stickiness and viral potential.

**Independent Test**: Can be fully tested by having a user add a friend, view friend's game activity, and compare scores on leaderboards. The test delivers value by adding social context and competitive elements.

**Acceptance Scenarios**:

1. **Given** a user wants to add friends, **When** they search for other users, **Then** they can send friend requests and manage friend relationships
2. **Given** a user has friends, **When** they view the social feed, **Then** they see friends' game activities and achievements
3. **Given** users play the same game, **When** they view the leaderboard, **Then** they see rankings with friend highlights
4. **Given** a user wants to challenge a friend, **When** they send a game challenge, **Then** the friend receives a notification and can accept

---

### User Story 7 - Game Collection and Offline Management (Priority: P3)

Users can save favorite games to collections, organize them by categories, and download games for offline play. Collections sync across devices, and offline games can be played without internet connectivity.

**Why this priority**: Collections and offline play enhance user convenience and expand usage scenarios. This feature is valuable for users with limited connectivity or who want to curate their game library.

**Independent Test**: Can be fully tested by having a user save games to collections, download a game for offline play, and verify it works without internet. The test delivers value by enabling offline entertainment and personalized game management.

**Acceptance Scenarios**:

1. **Given** a user finds a game they like, **When** they add it to their collection, **Then** the game is saved and accessible from their collection page
2. **Given** a user has multiple collections, **When** they organize games into categories, **Then** games are grouped and easy to find
3. **Given** a user wants to play offline, **When** they download a game, **Then** the game is available in their offline library
4. **Given** a user has offline games, **When** they open the platform without internet, **Then** they can access and play downloaded games
5. **Given** a user's game collection is updated on one device, **When** they access another device, **Then** collections are synchronized

---

### User Story 8 - Achievement System and User Growth (Priority: P3)

Users earn achievements and badges for completing milestones, unlocking levels, and demonstrating engagement. The achievement system provides gamification elements that motivate continued platform usage.

**Why this priority**: Achievement systems increase user engagement and provide additional motivation beyond points. This feature enhances the gamification aspect of the platform.

**Independent Test**: Can be fully tested by having a user complete various activities and verify achievements are unlocked and displayed. The test delivers value by providing recognition and progression feedback.

**Acceptance Scenarios**:

1. **Given** a user completes a milestone (e.g., play 10 games, earn 1000 points), **When** they reach the threshold, **Then** they receive an achievement notification and badge
2. **Given** a user wants to track their progress, **When** they view their achievement page, **Then** they see unlocked achievements, progress toward next achievements, and achievement history
3. **Given** a user earns an achievement, **When** they share it, **Then** friends can see the achievement and congratulate them

---

### Edge Cases

- What happens when a user tries to play a game that is temporarily unavailable or under maintenance?
- How does the system handle point transactions if the user's network connection is lost mid-transaction?
- What happens when a user attempts to redeem points for a reward that is out of stock or no longer available?
- How does the system prevent abuse of the invitation system (fake accounts, duplicate invitations, self-invitations)?
- What happens when a membership payment fails or is refunded?
- How does the system handle concurrent game sessions if a user opens multiple games simultaneously?
- What happens when point calculations result in fractional values?
- How does the system handle invitation link expiration or reuse?
- What happens when a user's device runs out of storage space while downloading a game for offline play?
- How does the system handle game updates when a user is playing the game offline?
- What happens when personalized recommendations cannot be generated (new user, insufficient data)?
- How does the system handle friend relationship conflicts (blocked users, deleted accounts)?
- What happens when a user tries to download a game that exceeds their offline storage quota?
- How does the system handle achievement unlocking if the user's network is disconnected?
- What happens when a game collection sync fails between devices?
- How does the system handle scenario-based recommendations when user context is unclear?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a unified interface for browsing and accessing multiple mini-games
- **FR-002**: System MUST organize games into categories (recommended, popular, latest, personalized)
- **FR-003**: System MUST support game search functionality with keyword matching
- **FR-004**: System MUST display game details including cover image, description, and play button
- **FR-005**: System MUST load and execute mini-games within the platform interface
- **FR-006**: System MUST track game play duration and session data
- **FR-007**: System MUST award points to users for completing game sessions (minimum duration required)
- **FR-008**: System MUST provide point-earning tasks including daily check-in, watching ads, playing games, and sharing
- **FR-009**: System MUST display current point balance to users
- **FR-010**: System MUST maintain point transaction history (earned and spent)
- **FR-011**: System MUST provide a redemption center with various reward options (membership trial, cash rewards, virtual items)
- **FR-012**: System MUST deduct points when users redeem rewards
- **FR-013**: System MUST require confirmation before processing point redemptions
- **FR-014**: System MUST support membership subscription with multiple plan tiers
- **FR-015**: System MUST display membership benefits and pricing to users
- **FR-016**: System MUST process membership payments through supported payment methods
- **FR-017**: System MUST activate membership privileges immediately upon successful payment
- **FR-072**: System MUST automatically retry failed payments up to 3 times before marking payment as failed
- **FR-073**: System MUST handle refunds according to platform rules: Apple IAP 7-day refund window, WeChat/Alipay per payment provider agreement
- **FR-074**: System MUST automatically process refund requests that meet platform criteria
- **FR-075**: System MUST revoke membership privileges when refund is successfully processed
- **FR-076**: System MUST notify users of payment failure and provide retry options
- **FR-077**: System MUST notify users of refund status and processing timeline
- **FR-018**: System MUST apply membership benefits (ad-free, point multipliers, priority access) automatically
- **FR-019**: System MUST display membership status and expiration date to users
- **FR-020**: System MUST generate unique invitation links or QR codes for each user
- **FR-021**: System MUST track invitation relationships (inviter and invitee)
- **FR-022**: System MUST award rewards to inviters when invitees complete registration
- **FR-023**: System MUST award additional rewards when invitees reach activity milestones
- **FR-024**: System MUST display invitation statistics (count, rewards, leaderboard) to users
- **FR-025**: System MUST support sharing invitation links via social media and messaging platforms
- **FR-026**: System MUST prevent invitation system abuse (duplicate accounts, self-invitations, fraudulent activity)
- **FR-065**: System MUST implement basic frequency limits for point-earning tasks (e.g., daily check-in once per day, ad watching limited per hour)
- **FR-066**: System MUST implement basic frequency limits for invitation features (e.g., maximum invitations per day, prevent duplicate registrations from same device/IP)
- **FR-067**: System MUST detect and prevent obvious abuse patterns (same device/IP creating multiple accounts, rapid point accumulation)
- **FR-027**: System MUST display point leaderboards and invitation leaderboards
- **FR-028**: System MUST support responsive design for mobile and desktop devices
- **FR-029**: System MUST handle offline scenarios gracefully with appropriate error messages
- **FR-030**: System MUST provide user account management (profile, settings, history)
- **FR-054**: System MUST support multiple authentication methods: phone/SMS verification, WeChat/QQ social login, email/password, and username/password
- **FR-055**: System MUST allow users to register using phone number with SMS verification code
- **FR-056**: System MUST support third-party social login (WeChat, QQ, Apple ID) as optional authentication method
- **FR-057**: System MUST support traditional account registration with username/email and password
- **FR-058**: System MUST allow users to link multiple authentication methods to a single account
- **FR-059**: System MUST provide password reset functionality via email or SMS
- **FR-060**: System MUST implement tiered data retention policy: active user data retained, inactive user data (no activity for 3 years) automatically deleted
- **FR-061**: System MUST support user account deletion with complete data removal within 30 days of deletion request
- **FR-062**: System MUST anonymize or delete personal identifiable information (PII) when user data is deleted
- **FR-063**: System MUST retain anonymized statistical data for business analysis after user data deletion
- **FR-064**: System MUST provide users with data export functionality before account deletion
- **FR-031**: System MUST provide personalized game recommendations based on user behavior and preferences
- **FR-032**: System MUST support scenario-based game recommendations (commute, break time, bedtime)
- **FR-033**: System MUST allow users to save games to collections and organize them by categories
- **FR-034**: System MUST synchronize game collections across user devices
- **FR-035**: System MUST support game downloads for offline play
- **FR-036**: System MUST manage offline game library and storage
- **FR-068**: System MUST enforce tiered offline storage quotas: free users 1GB, members 5GB, offline members 20GB
- **FR-069**: System MUST display current storage usage and available quota to users
- **FR-070**: System MUST prevent offline game downloads when storage quota is exceeded
- **FR-071**: System MUST allow users to manage offline games (delete to free space) when approaching quota limits
- **FR-037**: System MUST provide game update notifications and automatic update capabilities
- **FR-038**: System MUST track and display user achievements and badges
- **FR-039**: System MUST award achievements when users reach milestones
- **FR-040**: System MUST support friend relationships (add, remove, view friend activity)
- **FR-041**: System MUST display real-time leaderboards with friend highlights
- **FR-042**: System MUST support social sharing of achievements and game activities
- **FR-043**: System MUST provide friend activity feed showing friends' game sessions and achievements
- **FR-044**: System MUST support game challenges between friends
- **FR-045**: System MUST provide advertising task wall where users can earn points by trying other apps
- **FR-046**: System MUST track task completion and reward points for task wall activities
- **FR-047**: System MUST support game version management and update history
- **FR-048**: System MUST provide incremental game updates to minimize download size
- **FR-049**: System MUST display game update status and available updates to users
- **FR-050**: System MUST support cloud save functionality for game progress (membership feature)
- **FR-051**: System MUST provide user level and growth system with progression tracking
- **FR-052**: System MUST support team invitation mode for collaborative tasks
- **FR-053**: System MUST provide real-time notifications for friend invitations, achievements, and challenges

### Key Entities *(include if feature involves data)*

- **User**: Represents a platform user with attributes including user ID, nickname, avatar, registration date, membership status, and point balance. Relationships: has many game sessions, point transactions, invitations (as inviter and invitee), and redemptions.

- **Game**: Represents a mini-game available on the platform with attributes including game ID, title, description, cover image, category tags, point reward rules, minimum play duration, and availability status. Relationships: has many game sessions and user favorites.

- **Point Transaction**: Represents a point earning or spending event with attributes including transaction ID, user ID, transaction type (earn/spend), amount, source/reason, timestamp, and status. Relationships: belongs to one user.

- **Membership**: Represents a user's membership subscription with attributes including membership ID, user ID, plan type, start date, expiration date, payment status, and active privileges. Relationships: belongs to one user.

- **Invitation**: Represents an invitation relationship with attributes including invitation ID, inviter user ID, invitee user ID, invitation link/code, registration date, completion milestones, and reward status. Relationships: belongs to inviter user and invitee user.

- **Reward**: Represents a redeemable reward item with attributes including reward ID, name, description, point cost, reward type, availability status, and stock quantity. Relationships: has many redemptions.

- **Redemption**: Represents a point redemption transaction with attributes including redemption ID, user ID, reward ID, points spent, redemption date, delivery status, and confirmation. Relationships: belongs to one user and one reward.

- **Game Session**: Represents a user's game play session with attributes including session ID, user ID, game ID, start time, end time, duration, points earned, and completion status. Relationships: belongs to one user and one game.

- **Game Collection**: Represents a user's saved game collection with attributes including collection ID, user ID, collection name, category, creation date, and game count. Relationships: belongs to one user, has many collection items.

- **Collection Item**: Represents a game saved in a collection with attributes including item ID, collection ID, game ID, added date, and notes. Relationships: belongs to one collection and one game.

- **Offline Game**: Represents a game downloaded for offline play with attributes including download ID, user ID, game ID, download status, download date, file size, and version. Relationships: belongs to one user and one game.

- **Achievement**: Represents a user achievement with attributes including achievement ID, user ID, achievement type, unlocked date, progress, and badge image. Relationships: belongs to one user.

- **Friend Relationship**: Represents a friendship between users with attributes including relationship ID, user ID, friend ID, status (pending/accepted/blocked), and creation date. Relationships: belongs to two users.

- **Game Challenge**: Represents a challenge between friends with attributes including challenge ID, challenger ID, challengee ID, game ID, status, and expiration date. Relationships: belongs to challenger, challengee, and one game.

- **Recommendation**: Represents a personalized game recommendation with attributes including recommendation ID, user ID, game ID, recommendation reason, score, and scenario context. Relationships: belongs to one user and one game.

- **Task Wall Item**: Represents an advertising task wall item with attributes including task ID, task type, description, point reward, completion requirements, and status. Relationships: has many task completions.

- **Task Completion**: Represents a user's completion of a task wall item with attributes including completion ID, user ID, task ID, completion date, points awarded, and verification status. Relationships: belongs to one user and one task.

- **Game Update**: Represents a game version update with attributes including update ID, game ID, version number, update type (full/incremental), file size, release date, and update notes. Relationships: belongs to one game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can discover and start playing a game within 30 seconds of opening the platform
- **SC-002**: 90% of users who play a game for the minimum duration successfully receive points
- **SC-003**: Users can complete point redemption in under 2 minutes from selection to confirmation
- **SC-004**: 80% of users who view membership plans understand the benefits and pricing
- **SC-005**: Users who invite 3 or more friends show 40% higher retention rate than non-inviting users
- **SC-006**: Platform supports 10,000 concurrent users browsing and playing games without performance degradation
- **SC-007**: 70% of new users complete at least one point-earning activity within their first session
- **SC-008**: Invitation conversion rate (invitations sent to registrations) is at least 15%
- **SC-009**: Average user session duration increases by 25% after implementing point incentives
- **SC-010**: Membership subscription conversion rate is at least 5% of active users
- **SC-011**: 60% of users who receive personalized recommendations click on at least one recommended game
- **SC-012**: Users with game collections show 30% higher retention rate than users without collections
- **SC-013**: 40% of users who download games for offline play use offline mode at least once per week
- **SC-014**: Users who unlock achievements show 25% higher engagement than users who don't
- **SC-015**: 50% of users with friends on the platform interact with social features at least once per session
- **SC-016**: Game discovery efficiency improves by 30% with personalized recommendations
- **SC-017**: Offline game download success rate is at least 95%
- **SC-018**: Game collection sync success rate across devices is at least 98%

### Performance Criteria (Constitution Requirement)

- **PERF-001**: Game list page loads with FCP < 1.8s and LCP < 2.5s
- **PERF-002**: Game launch time (from click to playable) is under 3 seconds
- **PERF-003**: Point transaction processing (credit/debit) completes within 200ms
- **PERF-004**: API response time for game catalog and user data is P95 < 200ms, P99 < 500ms
- **PERF-005**: Platform supports infinite scroll or pagination without noticeable lag

### Testing Criteria (Constitution Requirement)

- **TEST-001**: Business logic test coverage ≥ 80% for point calculation, membership privilege application, and invitation reward logic
- **TEST-002**: All API endpoints for games, points, membership, and invitations have integration tests
- **TEST-003**: Critical user flows (browse-play-earn, invite-register-reward, membership purchase) have E2E tests
- **TEST-004**: All point transaction and redemption operations have unit tests with edge case coverage

### UX Criteria (Constitution Requirement)

- **UX-001**: All user interactions (button clicks, form submissions, game launches) provide visual feedback within 100ms
- **UX-002**: All error states (game load failure, payment failure, network errors) provide clear messages and recovery suggestions
- **UX-003**: All loading states (game loading, point processing, payment processing) display appropriate loading indicators
- **UX-004**: Platform meets WCAG 2.1 AA level accessibility standards for screen readers and keyboard navigation
- **UX-005**: All forms (membership purchase, point redemption) include real-time validation and error hints
- **UX-006**: Platform provides consistent visual design and interaction patterns across all pages

## Assumptions

- Users have internet connectivity for initial game loading and point transactions (offline play may be a future enhancement)
- Mini-games are hosted externally and loaded via iframe or similar embedding mechanism
- Payment processing is handled through third-party payment gateways (WeChat Pay, Alipay, Apple IAP)
- Payment failures trigger automatic retry up to 3 times; refunds follow platform rules (Apple 7-day window, WeChat/Alipay per agreement) with automatic processing
- Social sharing is supported through native device sharing capabilities or social media SDKs
- User authentication supports multiple methods: phone/SMS, WeChat/QQ social login, email/username with password, with ability to link multiple methods to one account
- User authentication and account management are handled by the platform (login, registration, profile management)
- Games are pre-approved and managed through an admin system (not part of this feature specification)
- Point values and reward costs are configurable through admin settings
- Membership plans and pricing are configurable through admin settings
- Invitation rewards and milestones are configurable through admin settings
- The platform supports both mobile (iOS, Android) and web browsers
- Personalized recommendation algorithms are implemented and continuously improved based on user behavior data
- Offline game downloads require sufficient device storage space and are subject to tiered storage quotas: free users 1GB, members 5GB, offline members 20GB
- Game collections and offline games sync across devices when users are logged in with the same account
- Achievement system milestones and criteria are configurable through admin settings
- Friend relationships require mutual consent (friend requests must be accepted)
- Task wall items are provided by third-party partners and subject to availability
- Game updates are managed by game developers and distributed through the platform
- Social features require user consent for sharing activity and achievements
- Offline games may have limited functionality compared to online versions (no leaderboards, no social features)
- Recommendation system requires minimum user activity data to generate meaningful suggestions
- Cloud save functionality is available only to members and requires active membership
- Data retention follows tiered policy: active data retained, inactive user data (3 years no activity) deleted, account deletion triggers complete removal within 30 days with anonymized statistics retained
- Rate limiting and anti-fraud measures are minimal: basic frequency checks applied only to points and invitation features to prevent obvious abuse while maintaining user experience
