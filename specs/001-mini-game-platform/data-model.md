# Data Model: Mini-Game Aggregation Platform

**Date**: 2025-11-12  
**Feature**: Mini-Game Aggregation Platform  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data model for the mini-game aggregation platform, including all entities, their attributes, relationships, validation rules, and state transitions.

## Database Schema

### Core Entities

#### 1. User

Represents a platform user with authentication, profile, and account information.

**Attributes**:
- `id` (UUID, Primary Key): Unique user identifier
- `nickname` (String, 50 chars): User display name
- `avatar` (String, URL): Avatar image URL
- `email` (String, 255, nullable): Email address (optional, for email/password auth)
- `phone` (String, 20, nullable): Phone number (optional, for SMS auth)
- `password_hash` (String, 255, nullable): Hashed password (for email/username auth)
- `point_balance` (Integer, default 0): Current point balance
- `membership_status` (Enum: 'free', 'member', 'offline_member'): Current membership tier
- `level` (Integer, default 1): User level in growth system
- `experience_points` (Integer, default 0): Experience points for leveling
- `registration_date` (Timestamp): Account creation date
- `last_active_date` (Timestamp, nullable): Last activity timestamp
- `is_active` (Boolean, default true): Account active status
- `is_deleted` (Boolean, default false): Soft delete flag
- `deletion_requested_at` (Timestamp, nullable): When user requested account deletion
- `created_at` (Timestamp): Record creation timestamp
- `updated_at` (Timestamp): Record update timestamp

**Relationships**:
- Has many: GameSession, PointTransaction, Invitation (as inviter), Invitation (as invitee), Redemption, GameCollection, OfflineGame, Achievement, FriendRelationship (as user), FriendRelationship (as friend), GameChallenge (as challenger), GameChallenge (as challengee), Recommendation, TaskCompletion

**Validation Rules**:
- Nickname: Required, 2-50 characters, alphanumeric and Chinese characters allowed
- Email: If provided, must be valid email format, unique
- Phone: If provided, must be valid phone format, unique
- Point balance: Cannot be negative
- Level: Must be >= 1

**Indexes**:
- Primary key: `id`
- Unique: `email` (where not null), `phone` (where not null)
- Index: `membership_status`, `last_active_date`, `is_deleted`

---

#### 2. UserAuthMethod

Represents authentication methods linked to a user account (supports multiple methods per user).

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `auth_type` (Enum: 'phone', 'email', 'wechat', 'qq', 'apple'): Authentication method type
- `auth_provider_id` (String, 255): Provider-specific identifier (phone number, email, social ID)
- `provider_data` (JSONB, nullable): Additional provider-specific data
- `is_primary` (Boolean, default false): Primary authentication method
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User

**Validation Rules**:
- At least one auth method must be primary per user
- auth_provider_id must be unique per auth_type

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id`
- Unique: `(auth_type, auth_provider_id)`
- Index: `user_id`, `is_primary`

---

#### 3. Game

Represents a mini-game available on the platform.

**Attributes**:
- `id` (UUID, Primary Key)
- `title` (String, 200): Game title
- `description` (Text): Game description
- `cover_image_url` (String, URL): Cover image URL
- `game_url` (String, URL): Game iframe URL
- `category_tags` (JSONB, Array): Array of category tags (e.g., ["puzzle", "casual"])
- `point_reward_rules` (JSONB): Point calculation rules
  ```json
  {
    "base_points": 10,
    "min_duration_seconds": 180,
    "points_per_minute": 5,
    "max_points_per_session": 100
  }
  ```
- `min_play_duration_seconds` (Integer, default 180): Minimum play duration to earn points
- `availability_status` (Enum: 'active', 'inactive', 'maintenance'): Game availability
- `is_featured` (Boolean, default false): Featured game flag
- `play_count` (Integer, default 0): Total play count
- `average_rating` (Decimal, nullable): Average user rating (1-5)
- `version` (String, 20): Current game version
- `developer_id` (UUID, nullable, Foreign Key): Game developer (future use)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Has many: GameSession, CollectionItem, OfflineGame, Recommendation, GameUpdate, GameChallenge

**Validation Rules**:
- Title: Required, 1-200 characters
- Game URL: Required, valid URL format
- Min play duration: Must be >= 0
- Point reward rules: Valid JSON structure

**Indexes**:
- Primary key: `id`
- Index: `availability_status`, `is_featured`, `category_tags` (GIN index for JSONB), `play_count`

---

#### 4. PointTransaction

Represents a point earning or spending event.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `transaction_type` (Enum: 'earn', 'spend'): Transaction direction
- `amount` (Integer): Point amount (positive for earn, negative for spend)
- `source` (String, 100): Source of transaction (e.g., 'game_play', 'daily_checkin', 'ad_watch', 'invitation', 'redemption')
- `source_id` (UUID, nullable): Reference to source entity (game_session_id, invitation_id, etc.)
- `description` (String, 255): Human-readable description
- `status` (Enum: 'pending', 'completed', 'failed', 'reversed'): Transaction status
- `balance_after` (Integer): User point balance after this transaction
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User

**Validation Rules**:
- Amount: Required, non-zero
- Transaction type 'earn' must have positive amount
- Transaction type 'spend' must have negative amount
- Status: Required

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id`
- Index: `user_id`, `transaction_type`, `source`, `created_at`, `status`

---

#### 5. Membership

Represents a user's membership subscription.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id, Unique): One membership per user
- `plan_type` (Enum: 'monthly', 'quarterly', 'yearly', 'offline_monthly'): Membership plan
- `start_date` (Timestamp): Membership start date
- `expiration_date` (Timestamp): Membership expiration date
- `payment_status` (Enum: 'pending', 'paid', 'failed', 'refunded'): Payment status
- `payment_method` (String, 50): Payment method used (wechat, alipay, apple_iap)
- `payment_transaction_id` (String, 255, nullable): Payment provider transaction ID
- `auto_renew` (Boolean, default false): Auto-renewal setting
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User

**Validation Rules**:
- Expiration date must be after start date
- Payment status 'paid' requires payment_transaction_id

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id` (unique)
- Index: `expiration_date`, `payment_status`

---

#### 6. Invitation

Represents an invitation relationship between users.

**Attributes**:
- `id` (UUID, Primary Key)
- `inviter_user_id` (UUID, Foreign Key → User.id)
- `invitee_user_id` (UUID, Foreign Key → User.id, nullable): Null until invitee registers
- `invitation_code` (String, 50, Unique): Unique invitation code/link
- `invitation_link` (String, URL): Full invitation URL
- `registration_date` (Timestamp, nullable): When invitee registered
- `completion_milestones` (JSONB): Milestones and completion status
  ```json
  {
    "first_game_played": false,
    "first_points_earned": false,
    "first_redemption": false
  }
  ```
- `reward_status` (Enum: 'pending', 'partial', 'completed'): Reward distribution status
- `points_awarded` (Integer, default 0): Total points awarded to inviter
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User (as inviter), User (as invitee)

**Validation Rules**:
- Invitation code: Required, unique, alphanumeric
- Inviter and invitee cannot be the same user
- Registration date must be after invitation creation

**Indexes**:
- Primary key: `id`
- Foreign keys: `inviter_user_id`, `invitee_user_id`
- Unique: `invitation_code`
- Index: `inviter_user_id`, `invitee_user_id`, `registration_date`

---

#### 7. Reward

Represents a redeemable reward item.

**Attributes**:
- `id` (UUID, Primary Key)
- `name` (String, 200): Reward name
- `description` (Text): Reward description
- `point_cost` (Integer): Points required to redeem
- `reward_type` (Enum: 'membership_trial', 'cash', 'virtual_item', 'coupon'): Reward type
- `reward_data` (JSONB, nullable): Reward-specific data (e.g., cash amount, coupon code)
- `availability_status` (Enum: 'available', 'out_of_stock', 'disabled'): Availability
- `stock_quantity` (Integer, nullable): Stock quantity (null for unlimited)
- `total_redeemed` (Integer, default 0): Total redemption count
- `is_featured` (Boolean, default false): Featured reward flag
- `valid_from` (Timestamp, nullable): Validity start date
- `valid_until` (Timestamp, nullable): Validity end date
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Has many: Redemption

**Validation Rules**:
- Name: Required, 1-200 characters
- Point cost: Required, must be > 0
- Stock quantity: If set, must be >= 0
- Valid until must be after valid from (if both set)

**Indexes**:
- Primary key: `id`
- Index: `availability_status`, `point_cost`, `is_featured`, `reward_type`

---

#### 8. Redemption

Represents a point redemption transaction.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `reward_id` (UUID, Foreign Key → Reward.id)
- `points_spent` (Integer): Points deducted
- `redemption_date` (Timestamp): When redemption occurred
- `delivery_status` (Enum: 'pending', 'processing', 'delivered', 'failed'): Delivery status
- `delivery_data` (JSONB, nullable): Delivery information (e.g., cash transfer details, coupon code)
- `confirmation_code` (String, 50, nullable): Redemption confirmation code
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User, Reward

**Validation Rules**:
- Points spent: Required, must be > 0
- Points spent must match reward point_cost at time of redemption
- Delivery status: Required

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `reward_id`
- Index: `user_id`, `redemption_date`, `delivery_status`

---

#### 9. GameSession

Represents a user's game play session.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `game_id` (UUID, Foreign Key → Game.id)
- `start_time` (Timestamp): Session start timestamp
- `end_time` (Timestamp, nullable): Session end timestamp
- `duration_seconds` (Integer, nullable): Calculated duration
- `points_earned` (Integer, default 0): Points earned in this session
- `completion_status` (Enum: 'in_progress', 'completed', 'abandoned'): Session status
- `game_state` (JSONB, nullable): Game-specific state data (for cloud save)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User, Game

**Validation Rules**:
- Start time: Required
- Duration: If end_time set, must be >= 0
- Points earned: Must be >= 0

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `game_id`
- Index: `user_id`, `game_id`, `start_time`, `completion_status`

---

#### 10. GameCollection

Represents a user's saved game collection.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `collection_name` (String, 100): Collection name
- `category` (String, 50, nullable): Collection category
- `game_count` (Integer, default 0): Number of games in collection
- `is_default` (Boolean, default false): Default collection flag
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User
- Has many: CollectionItem

**Validation Rules**:
- Collection name: Required, 1-100 characters
- Game count: Must be >= 0

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id`
- Index: `user_id`, `category`

---

#### 11. CollectionItem

Represents a game saved in a collection.

**Attributes**:
- `id` (UUID, Primary Key)
- `collection_id` (UUID, Foreign Key → GameCollection.id)
- `game_id` (UUID, Foreign Key → Game.id)
- `added_date` (Timestamp): When game was added
- `notes` (Text, nullable): User notes about this game
- `sort_order` (Integer, default 0): Display order in collection

**Relationships**:
- Belongs to: GameCollection, Game

**Validation Rules**:
- Game cannot be added to same collection twice

**Indexes**:
- Primary key: `id`
- Foreign keys: `collection_id`, `game_id`
- Unique: `(collection_id, game_id)`
- Index: `collection_id`, `sort_order`

---

#### 12. OfflineGame

Represents a game downloaded for offline play.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `game_id` (UUID, Foreign Key → Game.id)
- `download_status` (Enum: 'pending', 'downloading', 'completed', 'failed', 'deleted'): Download status
- `download_date` (Timestamp): When download started
- `file_size_bytes` (BigInteger): Downloaded file size
- `version` (String, 20): Game version downloaded
- `storage_path` (String, 500): Local storage path
- `last_played_date` (Timestamp, nullable): Last offline play date

**Relationships**:
- Belongs to: User, Game

**Validation Rules**:
- File size: Must be >= 0
- Version: Required

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `game_id`
- Index: `user_id`, `download_status`, `download_date`

---

#### 13. Achievement

Represents a user achievement.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `achievement_type` (String, 100): Achievement type identifier
- `achievement_name` (String, 200): Achievement display name
- `unlocked_date` (Timestamp, nullable): When achievement was unlocked
- `progress` (Integer, default 0): Current progress (0-100)
- `target_value` (Integer): Target value to unlock
- `badge_image_url` (String, URL, nullable): Badge image URL
- `is_unlocked` (Boolean, default false): Unlock status

**Relationships**:
- Belongs to: User

**Validation Rules**:
- Progress: Must be between 0 and target_value
- Is unlocked: True only if progress >= target_value

**Indexes**:
- Primary key: `id`
- Foreign key: `user_id`
- Index: `user_id`, `achievement_type`, `is_unlocked`

---

#### 14. FriendRelationship

Represents a friendship between users.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `friend_id` (UUID, Foreign Key → User.id)
- `status` (Enum: 'pending', 'accepted', 'blocked'): Relationship status
- `created_at` (Timestamp): When relationship was created
- `accepted_at` (Timestamp, nullable): When relationship was accepted
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User (as user), User (as friend)

**Validation Rules**:
- User and friend cannot be the same
- Unique relationship per user-friend pair (bidirectional)

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `friend_id`
- Unique: `(user_id, friend_id)`
- Index: `user_id`, `friend_id`, `status`

---

#### 15. GameChallenge

Represents a challenge between friends.

**Attributes**:
- `id` (UUID, Primary Key)
- `challenger_id` (UUID, Foreign Key → User.id)
- `challengee_id` (UUID, Foreign Key → User.id)
- `game_id` (UUID, Foreign Key → Game.id)
- `status` (Enum: 'pending', 'accepted', 'completed', 'expired', 'declined'): Challenge status
- `expiration_date` (Timestamp): Challenge expiration
- `challenger_score` (Integer, nullable): Challenger's score
- `challengee_score` (Integer, nullable): Challengee's score
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User (as challenger), User (as challengee), Game

**Validation Rules**:
- Challenger and challengee cannot be the same
- Expiration date must be in the future when created
- Scores: Must be >= 0 if set

**Indexes**:
- Primary key: `id`
- Foreign keys: `challenger_id`, `challengee_id`, `game_id`
- Index: `challenger_id`, `challengee_id`, `status`, `expiration_date`

---

#### 16. Recommendation

Represents a personalized game recommendation.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `game_id` (UUID, Foreign Key → Game.id)
- `recommendation_reason` (String, 200): Why this game was recommended
- `score` (Decimal): Recommendation score (0-1)
- `scenario_context` (String, 50, nullable): Scenario context (commute, break_time, bedtime)
- `is_displayed` (Boolean, default false): Whether recommendation was shown to user
- `is_clicked` (Boolean, default false): Whether user clicked recommendation
- `created_at` (Timestamp)
- `expires_at` (Timestamp): Recommendation expiration

**Relationships**:
- Belongs to: User, Game

**Validation Rules**:
- Score: Must be between 0 and 1
- Expires at must be after created at

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `game_id`
- Index: `user_id`, `score`, `scenario_context`, `expires_at`

---

#### 17. TaskWallItem

Represents an advertising task wall item.

**Attributes**:
- `id` (UUID, Primary Key)
- `task_type` (Enum: 'app_install', 'app_trial', 'survey', 'video_watch'): Task type
- `title` (String, 200): Task title
- `description` (Text): Task description
- `point_reward` (Integer): Points awarded for completion
- `completion_requirements` (JSONB): Task-specific requirements
- `partner_id` (String, 100, nullable): Partner/task provider ID
- `status` (Enum: 'active', 'inactive', 'expired'): Task status
- `valid_from` (Timestamp): Validity start
- `valid_until` (Timestamp): Validity end
- `max_completions` (Integer, nullable): Maximum completion count (null for unlimited)
- `current_completions` (Integer, default 0): Current completion count
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Has many: TaskCompletion

**Validation Rules**:
- Point reward: Must be > 0
- Valid until must be after valid from
- Max completions: If set, must be > 0

**Indexes**:
- Primary key: `id`
- Index: `task_type`, `status`, `valid_until`, `point_reward`

---

#### 18. TaskCompletion

Represents a user's completion of a task wall item.

**Attributes**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id)
- `task_id` (UUID, Foreign Key → TaskWallItem.id)
- `completion_date` (Timestamp): When task was completed
- `points_awarded` (Integer): Points awarded
- `verification_status` (Enum: 'pending', 'verified', 'rejected'): Verification status
- `verification_data` (JSONB, nullable): Verification evidence
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Belongs to: User, TaskWallItem

**Validation Rules**:
- Points awarded: Must be >= 0
- User cannot complete same task twice

**Indexes**:
- Primary key: `id`
- Foreign keys: `user_id`, `task_id`
- Unique: `(user_id, task_id)`
- Index: `user_id`, `completion_date`, `verification_status`

---

#### 19. GameUpdate

Represents a game version update.

**Attributes**:
- `id` (UUID, Primary Key)
- `game_id` (UUID, Foreign Key → Game.id)
- `version_number` (String, 20): Version number (semantic versioning)
- `update_type` (Enum: 'full', 'incremental'): Update type
- `file_size_bytes` (BigInteger): Update file size
- `download_url` (String, URL): Update download URL
- `release_date` (Timestamp): Release date
- `update_notes` (Text): Release notes
- `is_mandatory` (Boolean, default false): Mandatory update flag
- `created_at` (Timestamp)

**Relationships**:
- Belongs to: Game

**Validation Rules**:
- Version number: Required, semantic version format
- File size: Must be >= 0
- Release date: Required

**Indexes**:
- Primary key: `id`
- Foreign key: `game_id`
- Index: `game_id`, `version_number`, `release_date`

---

## State Transitions

### Membership Status
```
free → member (on payment)
member → free (on expiration or cancellation)
free → offline_member (on offline membership purchase)
offline_member → free (on expiration)
```

### Point Transaction Status
```
pending → completed (on successful processing)
pending → failed (on error)
completed → reversed (on refund/correction)
```

### Game Session Status
```
in_progress → completed (on normal exit)
in_progress → abandoned (on timeout or error)
```

### Invitation Reward Status
```
pending → partial (on first milestone)
partial → completed (on all milestones)
```

---

## Data Validation Rules

### User Registration
- Email or phone required (at least one)
- Password: 8+ characters, alphanumeric + special characters (if email/password auth)
- Phone: Valid format for target region

### Point Transactions
- Earn transactions: Positive amount, valid source
- Spend transactions: Negative amount, sufficient balance
- Idempotency: Same source_id cannot create duplicate transactions

### Membership
- One active membership per user
- Expiration date must be in future
- Payment must be verified before activation

### Invitations
- Invitation code: Unique, alphanumeric, 8-50 characters
- Self-invitation: Prevented (inviter != invitee)
- Duplicate invitations: Same user cannot invite same friend twice

---

## Data Retention Policy

### Active Data
- Retained indefinitely while user is active (last activity within 1 year)

### Inactive Data
- User data with no activity for 3 years: Automatically deleted
- Anonymized statistics retained for business analysis

### Account Deletion
- User-requested deletion: Complete removal within 30 days
- PII (personal identifiable information) deleted or anonymized
- Transaction history anonymized (remove user_id, hash identifiers)
- Statistical aggregates retained

---

## Indexing Strategy

### High-Frequency Queries
- User point balance lookups: Index on `user_id` + `point_balance`
- Game catalog queries: Index on `availability_status` + `is_featured` + `category_tags`
- Leaderboard queries: Index on `user_id` + `points_earned` + `created_at`
- Friend relationships: Index on `user_id` + `status`

### JSONB Indexes
- Game `category_tags`: GIN index for array searches
- Game `point_reward_rules`: GIN index for rule queries
- Invitation `completion_milestones`: GIN index for milestone queries

### Composite Indexes
- PointTransaction: `(user_id, created_at)` for transaction history
- GameSession: `(user_id, game_id, start_time)` for user game history
- Recommendation: `(user_id, score, expires_at)` for recommendation queries

---

## Migration Strategy

### Phase 1 (MVP)
- All entities in single PostgreSQL database
- Basic indexes for performance
- JSONB for flexible metadata

### Phase 2 (Scale)
- Partition large tables (GameSession, PointTransaction) by date
- Read replicas for analytics queries
- Separate databases for different services (microservices migration)

---

## Notes

- All timestamps use UTC timezone
- UUIDs used for all primary keys (better for distributed systems)
- Soft deletes used where appropriate (User, Game) for audit trail
- JSONB used for flexible, schema-less data (game metadata, rules, milestones)
- Foreign key constraints enforced for data integrity
- Cascade deletes configured appropriately (e.g., delete user → delete sessions)

