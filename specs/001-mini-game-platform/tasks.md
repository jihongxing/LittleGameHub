# Tasks: Mini-Game Aggregation Platform

**Input**: Design documents from `/specs/001-mini-game-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as they are critical for ensuring code quality per constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the web application structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend project structure (backend/src/modules, backend/src/common, backend/src/config, backend/tests)
- [X] T002 Create frontend project structure (frontend/src/components, frontend/src/pages, frontend/src/services, frontend/tests)
- [X] T003 [P] Initialize NestJS backend project with TypeScript in backend/
- [X] T004 [P] Initialize React + Vite frontend project with TypeScript in frontend/
- [X] T005 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js and backend/.prettierrc
- [X] T006 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js and frontend/.prettierrc
- [X] T007 [P] Setup TypeScript configuration for backend in backend/tsconfig.json
- [X] T008 [P] Setup TypeScript configuration for frontend in frontend/tsconfig.json
- [X] T009 [P] Configure Vite build tool in frontend/vite.config.ts
- [X] T010 [P] Setup Jest testing framework for backend in backend/jest.config.js
- [X] T011 [P] Setup Vitest testing framework for frontend in frontend/vitest.config.ts
- [X] T012 [P] Install and configure Ant Design in frontend/package.json
- [X] T013 [P] Install and configure Tailwind CSS in frontend/tailwind.config.js
- [X] T014 [P] Setup environment variable management in backend/src/config/env.ts
- [X] T015 [P] Setup environment variable management in frontend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T016 Setup PostgreSQL database connection in backend/src/config/database.ts
- [X] T017 Setup Redis connection in backend/src/config/redis.ts
- [X] T018 [P] Create database migration framework setup in backend/src/database/migrations/
- [X] T019 [P] Create User entity model in backend/src/modules/users/entities/user.entity.ts
- [X] T020 [P] Create UserAuthMethod entity model in backend/src/modules/auth/entities/user-auth-method.entity.ts
- [X] T021 [P] Create database migration for User and UserAuthMethod tables in backend/src/database/migrations/001_create_users.ts
- [X] T022 [P] Implement JWT authentication service in backend/src/modules/auth/services/jwt.service.ts
- [X] T023 [P] Implement authentication guards in backend/src/common/guards/jwt-auth.guard.ts
- [X] T024 [P] Implement authentication decorator in backend/src/common/decorators/current-user.decorator.ts
- [X] T025 [P] Setup API routing structure in backend/src/main.ts
- [X] T026 [P] Implement global error handling interceptor in backend/src/common/interceptors/error-handler.interceptor.ts
- [X] T027 [P] Implement request logging interceptor in backend/src/common/interceptors/logging.interceptor.ts
- [X] T028 [P] Implement validation pipe in backend/src/common/pipes/validation.pipe.ts
- [X] T029 [P] Setup API client service in frontend/src/services/api/client.ts
- [X] T030 [P] Setup authentication context/store in frontend/src/store/authStore.ts
- [X] T031 [P] Create layout components (Header, Footer, Navigation) in frontend/src/components/layout/
- [X] T032 [P] Setup React Router configuration in frontend/src/App.tsx
- [X] T033 [P] Create error boundary component in frontend/src/components/common/ErrorBoundary.tsx
- [X] T034 [P] Create loading component in frontend/src/components/common/Loading.tsx
- [X] T035 [P] Setup global styles with Tailwind CSS in frontend/src/styles/index.css

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse and Play Mini-Games (Priority: P1) 🎯 MVP

**Goal**: Users can discover, browse, and play multiple mini-games from a unified platform without leaving the application.

**Independent Test**: Can be fully tested by allowing a user to browse the game catalog, view game details, and launch a game. The test delivers value by providing access to entertainment content.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T036 [P] [US1] Integration test for GET /games endpoint in backend/tests/integration/games.test.ts
- [X] T037 [P] [US1] Integration test for GET /games/{gameId} endpoint in backend/tests/integration/games.test.ts
- [X] T038 [P] [US1] Integration test for POST /games/{gameId}/sessions endpoint in backend/tests/integration/game-sessions.test.ts
- [X] T039 [P] [US1] Component test for GameList page in frontend/tests/component/GameList.test.tsx
- [X] T040 [P] [US1] Component test for GameDetail page in frontend/tests/component/GameDetail.test.tsx
- [X] T041 [P] [US1] E2E test for browse and play flow in frontend/tests/e2e/browse-play.spec.ts

### Implementation for User Story 1

- [X] T042 [P] [US1] Create Game entity model in backend/src/modules/games/entities/game.entity.ts
- [X] T043 [P] [US1] Create GameSession entity model in backend/src/modules/games/entities/game-session.entity.ts
- [X] T044 [P] [US1] Create database migration for Game and GameSession tables in backend/src/database/migrations/002_create_games.ts
- [X] T045 [US1] Implement GameService with catalog and search methods in backend/src/modules/games/services/game.service.ts
- [X] T046 [US1] Implement GameSessionService for session management in backend/src/modules/games/services/game-session.service.ts
- [X] T047 [US1] Implement GET /games endpoint in backend/src/modules/games/controllers/games.controller.ts
- [X] T048 [US1] Implement GET /games/{gameId} endpoint in backend/src/modules/games/controllers/games.controller.ts
- [X] T049 [US1] Implement POST /games/{gameId}/sessions endpoint in backend/src/modules/games/controllers/games.controller.ts
- [X] T050 [US1] Implement PATCH /games/{gameId}/sessions/{sessionId} endpoint in backend/src/modules/games/controllers/games.controller.ts
- [X] T051 [US1] Create games API service in frontend/src/services/api/games.ts
- [X] T052 [US1] Create GameCard component in frontend/src/components/business/GameCard.tsx
- [X] T053 [US1] Create GameList page component in frontend/src/pages/Home/GameList.tsx
- [X] T054 [US1] Create GameDetail page component in frontend/src/pages/Game/GameDetail.tsx
- [X] T055 [US1] Create GamePlayer component with iframe sandbox in frontend/src/components/business/GamePlayer.tsx
- [X] T056 [US1] Implement game search functionality in frontend/src/pages/Home/GameList.tsx
- [X] T057 [US1] Implement infinite scroll or pagination in frontend/src/pages/Home/GameList.tsx
- [X] T058 [US1] Implement game session tracking with postMessage communication in frontend/src/components/business/GamePlayer.tsx
- [X] T059 [US1] Add game category filtering in frontend/src/pages/Home/GameList.tsx
- [X] T060 [US1] Add error handling for game load failures in frontend/src/components/business/GamePlayer.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Earn and Manage Points (Priority: P1) 🎯 MVP

**Goal**: Users can earn points through various activities and use points to redeem rewards. The system tracks point balance and transaction history.

**Independent Test**: Can be fully tested by having a user complete point-earning activities (play a game, watch an ad, check in) and verify points are credited, then redeem points for a reward.

### Tests for User Story 2

- [X] T061 [P] [US2] Integration test for GET /points/balance endpoint in backend/tests/integration/points.test.ts
- [X] T062 [P] [US2] Integration test for GET /points/transactions endpoint in backend/tests/integration/points.test.ts
- [X] T063 [P] [US2] Integration test for POST /points/tasks/{taskId}/complete endpoint in backend/tests/integration/points.test.ts
- [X] T064 [P] [US2] Integration test for POST /rewards/{rewardId}/redeem endpoint in backend/tests/integration/rewards.test.ts
- [X] T065 [P] [US2] Unit test for point calculation logic in backend/tests/unit/points.service.test.ts
- [X] T066 [P] [US2] Component test for Points page in frontend/tests/component/PointsPage.test.tsx
- [X] T067 [P] [US2] E2E test for earn and redeem flow in frontend/tests/e2e/points-flow.spec.ts

### Implementation for User Story 2

- [X] T068 [P] [US2] Create PointTransaction entity model in backend/src/modules/points/entities/point-transaction.entity.ts
- [X] T069 [P] [US2] Create Reward entity model in backend/src/modules/rewards/entities/reward.entity.ts
- [X] T070 [P] [US2] Create Redemption entity model in backend/src/modules/rewards/entities/redemption.entity.ts
- [X] T071 [P] [US2] Create database migration for PointTransaction, Reward, and Redemption tables in backend/src/database/migrations/003_create_points_rewards.ts
- [X] T072 [US2] Implement PointService with balance and transaction methods in backend/src/modules/points/services/point.service.ts
- [X] T073 [US2] Implement point calculation logic based on game session duration in backend/src/modules/points/services/point-calculation.service.ts
- [X] T074 [US2] Implement point task system (daily check-in, ad watch, etc.) in backend/src/modules/points/services/point-task.service.ts
- [X] T075 [US2] Implement RewardService with redemption logic in backend/src/modules/rewards/services/reward.service.ts
- [X] T076 [US2] Implement GET /points/balance endpoint in backend/src/modules/points/controllers/points.controller.ts
- [X] T077 [US2] Implement GET /points/transactions endpoint in backend/src/modules/points/controllers/points.controller.ts
- [X] T078 [US2] Implement GET /points/tasks endpoint in backend/src/modules/points/controllers/points.controller.ts
- [X] T079 [US2] Implement POST /points/tasks/{taskId}/complete endpoint in backend/src/modules/points/controllers/points.controller.ts
- [X] T080 [US2] Implement GET /rewards endpoint in backend/src/modules/rewards/controllers/rewards.controller.ts
- [X] T081 [US2] Implement POST /rewards/{rewardId}/redeem endpoint in backend/src/modules/rewards/controllers/rewards.controller.ts
- [X] T082 [US2] Create points API service in frontend/src/services/api/points.ts
- [X] T083 [US2] Create rewards API service in frontend/src/services/api/rewards.ts
- [X] T084 [US2] Create PointsPage component in frontend/src/pages/Points/PointsPage.tsx
- [X] T085 [US2] Create PointTaskList component in frontend/src/components/business/PointTaskList.tsx
- [X] T086 [US2] Create RewardList component in frontend/src/components/business/RewardList.tsx
- [X] T087 [US2] Create PointTransactionHistory component in frontend/src/components/business/PointTransactionHistory.tsx
- [X] T088 [US2] Implement point earning from game sessions in frontend/src/components/business/GamePlayer.tsx
- [X] T089 [US2] Implement daily check-in task UI in frontend/src/components/business/PointTaskList.tsx
- [X] T090 [US2] Implement ad watching task integration in frontend/src/components/business/AdWatchTask.tsx
- [X] T091 [US2] Implement reward redemption flow with confirmation in frontend/src/components/business/RewardList.tsx
- [X] T092 [US2] Add point balance display in frontend header in frontend/src/components/layout/Header.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Membership Subscription and Privileges (Priority: P2)

**Goal**: Users can subscribe to membership plans that provide exclusive benefits such as ad-free experience, point multipliers, priority access to new games, and cloud save functionality.

**Independent Test**: Can be fully tested by having a user purchase a membership, verify privileges are activated (no ads, point multiplier), and confirm membership status is displayed.

### Tests for User Story 3

- [X] T093 [P] [US3] Integration test for GET /membership endpoint in backend/tests/integration/membership.test.ts
- [X] T094 [P] [US3] Integration test for POST /membership/subscribe endpoint in backend/tests/integration/membership.test.ts
- [X] T095 [P] [US3] Unit test for membership privilege application logic in backend/tests/unit/membership.service.test.ts
- [X] T096 [P] [US3] Component test for Membership page in frontend/tests/component/MembershipPage.test.tsx
- [X] T097 [P] [US3] E2E test for membership purchase flow in frontend/tests/e2e/membership-purchase.spec.ts

### Implementation for User Story 3

- [X] T098 [P] [US3] Create Membership entity model in backend/src/modules/membership/entities/membership.entity.ts
- [X] T099 [P] [US3] Create database migration for Membership table in backend/src/database/migrations/004_create_membership.ts
- [X] T100 [US3] Implement MembershipService with subscription and privilege logic in backend/src/modules/membership/services/membership.service.ts
- [X] T101 [US3] Implement payment processing service (WeChat Pay, Alipay, Apple IAP) in backend/src/modules/membership/services/payment.service.ts
- [X] T102 [US3] Implement payment retry logic (3 attempts) in backend/src/modules/membership/services/payment.service.ts
- [X] T103 [US3] Implement refund processing service in backend/src/modules/membership/services/refund.service.ts
- [X] T104 [US3] Implement membership privilege middleware (ad-free, point multiplier) in backend/src/common/guards/membership-privilege.guard.ts
- [X] T105 [US3] Implement GET /membership endpoint in backend/src/modules/membership/controllers/membership.controller.ts
- [X] T106 [US3] Implement GET /membership/plans endpoint in backend/src/modules/membership/controllers/membership.controller.ts
- [X] T107 [US3] Implement POST /membership/subscribe endpoint in backend/src/modules/membership/controllers/membership.controller.ts
- [X] T108 [US3] Implement payment webhook handler in backend/src/modules/membership/controllers/payment-webhook.controller.ts
- [X] T109 [US3] Create membership API service in frontend/src/services/api/membership.ts
- [X] T110 [US3] Create MembershipPage component in frontend/src/pages/Membership/MembershipPage.tsx
- [X] T111 [US3] Create MembershipPlanCard component in frontend/src/components/business/MembershipPlanCard.tsx
- [X] T112 [US3] Implement membership purchase flow with payment integration in frontend/src/pages/Membership/MembershipPage.tsx
- [X] T113 [US3] Implement ad-free experience for members in frontend/src/components/business/GamePlayer.tsx
- [X] T114 [US3] Implement point multiplier display and application in frontend/src/components/business/PointDisplay.tsx
- [X] T115 [US3] Implement membership status display in frontend header in frontend/src/components/layout/Header.tsx
- [X] T116 [US3] Implement membership expiration notification in frontend/src/components/business/MembershipExpirationNotice.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Invite Friends and Viral Sharing (Priority: P2)

**Goal**: Users can invite friends to join the platform through shareable links or QR codes. When invited friends register and complete activities, the inviter receives rewards.

**Independent Test**: Can be fully tested by having a user generate an invitation link, share it with a friend who registers, and verify both users receive appropriate rewards.

### Tests for User Story 4

- [X] T117 [P] [US4] Integration test for GET /invitations endpoint in backend/tests/integration/invitations.test.ts
- [X] T118 [P] [US4] Integration test for POST /invitations/generate endpoint in backend/tests/integration/invitations.test.ts
- [X] T119 [P] [US4] Unit test for invitation reward calculation logic in backend/tests/unit/invitation.service.test.ts
- [X] T120 [P] [US4] Component test for Invitations page in frontend/tests/component/InvitationsPage.test.tsx
- [X] T121 [P] [US4] E2E test for invitation and reward flow in frontend/tests/e2e/invitation-flow.spec.ts

### Implementation for User Story 4

- [X] T122 [P] [US4] Create Invitation entity model in backend/src/modules/invitations/entities/invitation.entity.ts
- [X] T123 [P] [US4] Create database migration for Invitation table in backend/src/database/migrations/005_create_invitations.ts
- [X] T124 [US4] Implement InvitationService with link generation and tracking in backend/src/modules/invitations/services/invitation.service.ts
- [X] T125 [US4] Implement invitation reward calculation and distribution in backend/src/modules/invitations/services/invitation-reward.service.ts
- [X] T126 [US4] Implement invitation abuse prevention (duplicate accounts, self-invitations) in backend/src/modules/invitations/services/invitation-validation.service.ts
- [X] T127 [US4] Implement GET /invitations endpoint in backend/src/modules/invitations/controllers/invitations.controller.ts
- [X] T128 [US4] Implement POST /invitations/generate endpoint in backend/src/modules/invitations/controllers/invitations.controller.ts
- [X] T129 [US4] Implement invitation link processing during registration in backend/src/modules/auth/services/auth.service.ts
- [X] T130 [US4] Create invitations API service in frontend/src/services/api/invitations.ts
- [X] T131 [US4] Create InvitationsPage component in frontend/src/pages/Profile/InvitationsPage.tsx
- [X] T132 [US4] Create InvitationLinkCard component with QR code generation in frontend/src/components/business/InvitationLinkCard.tsx
- [X] T133 [US4] Create InvitationStats component in frontend/src/components/business/InvitationStats.tsx
- [X] T134 [US4] Implement social sharing functionality (WeChat, QQ) in frontend/src/components/business/ShareButton.tsx
- [X] T135 [US4] Implement invitation leaderboard display in frontend/src/components/business/InvitationLeaderboard.tsx
- [X] T136 [US4] Implement invitation reward notifications in frontend/src/components/business/InvitationRewardNotification.tsx

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Personalized Game Recommendations (Priority: P2)

**Goal**: Users receive personalized game recommendations based on their gaming behavior, preferences, and user profile.

**Independent Test**: Can be fully tested by having a user play several games, then viewing the personalized recommendation section to verify games match their interests.

### Tests for User Story 5

- [X] T137 [P] [US5] Integration test for GET /recommendations endpoint in backend/tests/integration/recommendations.test.ts
- [X] T138 [P] [US5] Unit test for recommendation algorithm in backend/tests/unit/recommendation.service.test.ts
- [X] T139 [P] [US5] Component test for Recommendations component in frontend/tests/component/Recommendations.test.tsx

### Implementation for User Story 5

- [X] T140 [P] [US5] Create Recommendation entity model in backend/src/modules/recommendations/entities/recommendation.entity.ts
- [X] T141 [P] [US5] Create database migration for Recommendation table in backend/src/database/migrations/006_create_recommendations.ts
- [X] T142 [US5] Implement basic recommendation algorithm (rule-based for MVP) in backend/src/modules/recommendations/services/recommendation.service.ts
- [X] T143 [US5] Implement scenario-based recommendation logic (commute, break_time, bedtime) in backend/src/modules/recommendations/services/scenario-recommendation.service.ts
- [X] T144 [US5] Implement GET /recommendations endpoint in backend/src/modules/recommendations/controllers/recommendations.controller.ts
- [X] T145 [US5] Create recommendations API service in frontend/src/services/api/recommendations.ts
- [X] T146 [US5] Create Recommendations component in frontend/src/components/business/Recommendations.tsx
- [X] T147 [US5] Create RecommendationCard component in frontend/src/components/business/RecommendationCard.tsx
- [X] T148 [US5] Integrate recommendations into Home page in frontend/src/pages/Home/GameList.tsx
- [X] T149 [US5] Implement scenario selector UI in frontend/src/components/business/ScenarioSelector.tsx
- [X] T150 [US5] Display recommendation reason in frontend/src/components/business/RecommendationCard.tsx

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - Social Features and Friend Interactions (Priority: P3)

**Goal**: Users can add friends, view friend activity, compete on leaderboards, and interact within game communities.

**Independent Test**: Can be fully tested by having a user add a friend, view friend's game activity, and compare scores on leaderboards.

### Tests for User Story 6

- [X] T151 [P] [US6] Integration test for GET /friends endpoint in backend/tests/integration/social.test.ts
- [X] T152 [P] [US6] Integration test for POST /friends/requests endpoint in backend/tests/integration/social.test.ts
- [X] T153 [P] [US6] Integration test for GET /leaderboards endpoint in backend/tests/integration/social.test.ts
- [X] T154 [P] [US6] Component test for Social page in frontend/tests/component/SocialPage.test.tsx

### Implementation for User Story 6

- [X] T155 [P] [US6] Create FriendRelationship entity model in backend/src/modules/social/entities/friend-relationship.entity.ts
- [X] T156 [P] [US6] Create GameChallenge entity model in backend/src/modules/social/entities/game-challenge.entity.ts
- [X] T157 [P] [US6] Create database migration for FriendRelationship and GameChallenge tables in backend/src/database/migrations/007_create_social.ts
- [X] T158 [US6] Implement FriendService with friend request and management logic in backend/src/modules/social/services/friend.service.ts
- [X] T159 [US6] Implement LeaderboardService with real-time ranking in backend/src/modules/social/services/leaderboard.service.ts
- [X] T160 [US6] Implement GameChallengeService in backend/src/modules/social/services/game-challenge.service.ts
- [X] T161 [US6] Implement WebSocket gateway for real-time notifications in backend/src/modules/social/gateways/notifications.gateway.ts
- [X] T162 [US6] Implement GET /friends endpoint in backend/src/modules/social/controllers/friends.controller.ts
- [X] T163 [US6] Implement POST /friends/requests endpoint in backend/src/modules/social/controllers/friends.controller.ts
- [X] T164 [US6] Implement GET /leaderboards endpoint in backend/src/modules/social/controllers/leaderboards.controller.ts
- [X] T165 [US6] Create social API service in frontend/src/services/api/social.ts
- [X] T166 [US6] Create SocialPage component in frontend/src/pages/Social/SocialPage.tsx
- [X] T167 [US6] Create FriendList component in frontend/src/components/business/FriendList.tsx
- [X] T168 [US6] Create Leaderboard component in frontend/src/components/business/Leaderboard.tsx
- [X] T169 [US6] Create FriendActivityFeed component in frontend/src/components/business/FriendActivityFeed.tsx
- [X] T170 [US6] Implement WebSocket client for real-time updates in frontend/src/services/websocket/client.ts
- [X] T171 [US6] Implement friend request UI in frontend/src/components/business/FriendRequestButton.tsx
- [X] T172 [US6] Implement game challenge UI in frontend/src/components/business/GameChallengeButton.tsx

**Checkpoint**: At this point, User Stories 1-6 should all work independently

---

## Phase 9: User Story 7 - Game Collection and Offline Management (Priority: P3)

**Goal**: Users can save favorite games to collections, organize them by categories, and download games for offline play.

**Independent Test**: Can be fully tested by having a user save games to collections, download a game for offline play, and verify it works without internet.

### Tests for User Story 7

- [X] T173 [P] [US7] Integration test for GET /collections endpoint in backend/tests/integration/collections.test.ts
- [X] T174 [P] [US7] Integration test for POST /collections endpoint in backend/tests/integration/collections.test.ts
- [X] T175 [P] [US7] Integration test for POST /offline/games/{gameId}/download endpoint in backend/tests/integration/offline.test.ts
- [X] T176 [P] [US7] Component test for Collections page in frontend/tests/component/CollectionsPage.test.tsx

### Implementation for User Story 7

- [X] T177 [P] [US7] Create GameCollection entity model in backend/src/modules/collections/entities/game-collection.entity.ts
- [X] T178 [P] [US7] Create CollectionItem entity model in backend/src/modules/collections/entities/collection-item.entity.ts
- [X] T179 [P] [US7] Create OfflineGame entity model in backend/src/modules/offline/entities/offline-game.entity.ts
- [X] T180 [P] [US7] Create database migration for GameCollection, CollectionItem, and OfflineGame tables in backend/src/database/migrations/008_create_collections_offline.ts
- [X] T181 [US7] Implement GameCollectionService with CRUD operations in backend/src/modules/collections/services/collection.service.ts
- [X] T182 [US7] Implement OfflineGameService with download and storage management in backend/src/modules/offline/services/offline-game.service.ts
- [X] T183 [US7] Implement storage quota enforcement (1GB free, 5GB member, 20GB offline member) in backend/src/modules/offline/services/storage-quota.service.ts
- [X] T184 [US7] Implement collection sync across devices in backend/src/modules/collections/services/collection-sync.service.ts
- [X] T185 [US7] Implement GET /collections endpoint in backend/src/modules/collections/controllers/collections.controller.ts
- [X] T186 [US7] Implement POST /collections endpoint in backend/src/modules/collections/controllers/collections.controller.ts
- [X] T187 [US7] Implement POST /collections/{collectionId}/games endpoint in backend/src/modules/collections/controllers/collections.controller.ts
- [X] T188 [US7] Implement GET /offline/games endpoint in backend/src/modules/offline/controllers/offline.controller.ts
- [X] T189 [US7] Implement POST /offline/games/{gameId}/download endpoint in backend/src/modules/offline/controllers/offline.controller.ts
- [X] T190 [US7] Implement DELETE /offline/games/{gameId} endpoint in backend/src/modules/offline/controllers/offline.controller.ts
- [X] T191 [US7] Create collections API service in frontend/src/services/api/collections.ts
- [X] T192 [US7] Create offline API service in frontend/src/services/api/offline.ts
- [X] T193 [US7] Create CollectionsPage component in frontend/src/pages/Collections/CollectionsPage.tsx
- [X] T194 [US7] Create OfflineGamesPage component in frontend/src/pages/Offline/OfflineGamesPage.tsx
- [X] T195 [US7] Implement Service Worker for offline caching in frontend/public/sw.js
- [X] T196 [US7] Implement IndexedDB storage for offline games in frontend/src/utils/offline-storage.ts
- [X] T197 [US7] Create CollectionManager component in frontend/src/components/business/CollectionManager.tsx
- [X] T198 [US7] Create OfflineGameCard component in frontend/src/components/business/OfflineGameCard.tsx
- [X] T199 [US7] Implement storage quota display in frontend/src/components/business/StorageQuotaDisplay.tsx
- [X] T200 [US7] Implement offline game download progress indicator in frontend/src/components/business/DownloadProgress.tsx
- [X] T201 [US7] Implement collection sync across devices in frontend/src/services/sync/collection-sync.ts

**Checkpoint**: At this point, User Stories 1-7 should all work independently

---

## Phase 10: User Story 8 - Achievement System and User Growth (Priority: P3)

**Goal**: Users earn achievements and badges for completing milestones, unlocking levels, and demonstrating engagement.

**Independent Test**: Can be fully tested by having a user complete various activities and verify achievements are unlocked and displayed.

### Tests for User Story 8

- [X] T202 [P] [US8] Integration test for GET /achievements endpoint in backend/tests/integration/achievements.test.ts
- [X] T203 [P] [US8] Unit test for achievement unlocking logic in backend/tests/unit/achievement.service.test.ts
- [X] T204 [P] [US8] Component test for Achievements page in frontend/tests/component/AchievementsPage.test.tsx

### Implementation for User Story 8

- [X] T205 [P] [US8] Create Achievement entity model in backend/src/modules/achievements/entities/achievement.entity.ts
- [X] T206 [P] [US8] Create database migration for Achievement table in backend/src/database/migrations/009_create_achievements.ts
- [X] T207 [US8] Implement AchievementService with milestone tracking in backend/src/modules/achievements/services/achievement.service.ts
- [X] T208 [US8] Implement achievement unlock detection logic in backend/src/modules/achievements/services/achievement-detector.service.ts
- [X] T209 [US8] Implement user level and experience system in backend/src/modules/users/services/user-growth.service.ts
- [X] T210 [US8] Implement GET /achievements endpoint in backend/src/modules/achievements/controllers/achievements.controller.ts
- [X] T211 [US8] Create achievements API service in frontend/src/services/api/achievements.ts
- [X] T212 [US8] Create AchievementsPage component in frontend/src/pages/Profile/AchievementsPage.tsx
- [X] T213 [US8] Create AchievementCard component in frontend/src/components/business/AchievementCard.tsx
- [X] T214 [US8] Create AchievementProgress component in frontend/src/components/business/AchievementProgress.tsx
- [X] T215 [US8] Implement achievement unlock notification in frontend/src/components/business/AchievementNotification.tsx
- [X] T216 [US8] Implement user level display in frontend/src/components/business/UserLevelDisplay.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Code Quality (Constitution Requirement)
- [X] T217 [P] Run ESLint and TypeScript type checking, fix all errors in backend/
- [X] T218 [P] Run ESLint and TypeScript type checking, fix all errors in frontend/
- [X] T219 [P] Add JSDoc comments to all functions/classes/modules in backend/src/
- [X] T220 [P] Add JSDoc comments to all functions/classes/modules in frontend/src/
- [X] T221 Code cleanup and refactoring (reduce complexity if > 10) in backend/src/
- [X] T222 Code cleanup and refactoring (reduce complexity if > 10) in frontend/src/
- [X] T223 [P] Documentation updates in docs/

### Testing Standards (Constitution Requirement)
- [X] T224 [P] Verify test coverage ≥ 80% for business logic in backend/tests/
- [X] T225 [P] Verify test coverage ≥ 80% for business logic in frontend/tests/
- [X] T226 [P] Add missing unit tests in backend/tests/unit/
- [X] T227 [P] Add missing unit tests in frontend/tests/unit/
- [X] T228 [P] Add missing integration tests in backend/tests/integration/
- [X] T229 [P] Add missing component tests in frontend/tests/component/
- [X] T230 [P] Add missing E2E tests for critical flows in frontend/tests/e2e/

### UX Consistency (Constitution Requirement)
- [X] T231 [P] Verify all interactions provide feedback within 100ms in frontend/src/
- [X] T232 [P] Add loading indicators for all async operations in frontend/src/components/
- [X] T233 [P] Improve error messages and recovery suggestions in frontend/src/components/
- [X] T234 [P] Verify responsive design (mobile + desktop) in frontend/src/
- [X] T235 [P] Accessibility audit and fixes (WCAG 2.1 AA) in frontend/src/

### Performance Requirements (Constitution Requirement)
- [X] T236 Performance optimization across all stories in backend/src/
- [X] T237 Performance optimization across all stories in frontend/src/
- [X] T238 [P] Verify FCP < 1.8s, LCP < 2.5s, FID < 100ms, CLS < 0.1 using Lighthouse
- [X] T239 [P] Optimize API response times (P95 < 200ms, P99 < 500ms) in backend/src/
- [X] T240 [P] Optimize database queries (add indexes, fix slow queries) in backend/src/database/migrations/
- [X] T241 [P] Enable resource compression (Gzip/Brotli) in backend/src/main.ts
- [X] T242 [P] Configure CDN for static assets in frontend/vite.config.ts
- [X] T243 [P] Convert images to WebP format with fallback in frontend/src/assets/
- [X] T244 [P] Implement code splitting and lazy loading in frontend/src/App.tsx
- [X] T245 [P] Run Lighthouse CI and fix performance issues

### Other
- [X] T246 Security hardening (rate limiting, input validation, SQL injection prevention) in backend/src/
- [X] T247 Implement data retention job for inactive users in backend/src/jobs/data-retention.job.ts
- [X] T248 Implement account deletion job (30-day cleanup) in backend/src/jobs/account-deletion.job.ts
- [X] T249 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 (uses GameSession for point calculation)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US2 (applies point multiplier)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Integrates with US2 (awards points for invitations)
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (uses game play history)
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 and US2 (uses game sessions and points)
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 (uses Game entity)
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 and US2 (tracks milestones)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/controllers
- Backend before frontend
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for GET /games endpoint in backend/tests/integration/games.test.ts"
Task: "Integration test for GET /games/{gameId} endpoint in backend/tests/integration/games.test.ts"
Task: "Integration test for POST /games/{gameId}/sessions endpoint in backend/tests/integration/game-sessions.test.ts"
Task: "Component test for GameList page in frontend/tests/component/GameList.test.tsx"
Task: "Component test for GameDetail page in frontend/tests/component/GameDetail.test.tsx"

# Launch all models for User Story 1 together:
Task: "Create Game entity model in backend/src/modules/games/entities/game.entity.ts"
Task: "Create GameSession entity model in backend/src/modules/games/entities/game-session.entity.ts"
Task: "Create database migration for Game and GameSession tables in backend/src/database/migrations/002_create_games.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Games)
   - Developer B: User Story 2 (Points)
   - Developer C: User Story 3 (Membership)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks include exact file paths for clarity
- Follow constitution requirements for code quality, testing, UX, and performance

