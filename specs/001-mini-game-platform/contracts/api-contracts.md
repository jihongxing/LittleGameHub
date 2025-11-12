# API Contracts: Mini-Game Aggregation Platform

**Date**: 2025-11-12  
**Feature**: Mini-Game Aggregation Platform  
**Phase**: 1 - Design & Contracts

## API Overview

**Base URL**: `https://api.gamehub.com/v1`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`  
**Response Format**: JSON

## Authentication

### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "auth_method": "phone" | "email" | "wechat" | "qq" | "apple",
  "identifier": "string", // phone number, email, or social ID
  "password": "string", // required for email auth
  "verification_code": "string", // required for phone/SMS auth
  "nickname": "string"
}
```

**Response** (201 Created):
```json
{
  "user_id": "uuid",
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600
}
```

---

### POST /auth/login

Login with authentication method.

**Request Body**:
```json
{
  "auth_method": "phone" | "email" | "wechat" | "qq" | "apple",
  "identifier": "string",
  "password": "string", // required for email auth
  "verification_code": "string" // required for phone/SMS auth
}
```

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600
}
```

---

### POST /auth/refresh

Refresh access token.

**Request Body**:
```json
{
  "refresh_token": "string"
}
```

**Response** (200 OK):
```json
{
  "access_token": "string",
  "expires_in": 3600
}
```

---

## Games

### GET /games

Get game catalog with filtering and pagination.

**Query Parameters**:
- `category` (string, optional): Filter by category tag
- `search` (string, optional): Search by title/description
- `status` (string, optional): Filter by availability status
- `page` (integer, default 1): Page number
- `limit` (integer, default 20): Items per page
- `sort` (string, optional): Sort by (popular, latest, rating)

**Response** (200 OK):
```json
{
  "games": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "cover_image_url": "string",
      "category_tags": ["string"],
      "point_reward_rules": {
        "base_points": 10,
        "min_duration_seconds": 180
      },
      "play_count": 0,
      "average_rating": 4.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

### GET /games/{gameId}

Get game details.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "cover_image_url": "string",
  "game_url": "string",
  "category_tags": ["string"],
  "point_reward_rules": {},
  "min_play_duration_seconds": 180,
  "play_count": 0,
  "average_rating": 4.5,
  "version": "1.0.0"
}
```

---

### POST /games/{gameId}/sessions

Start a game session.

**Request Body**:
```json
{}
```

**Response** (201 Created):
```json
{
  "session_id": "uuid",
  "game_id": "uuid",
  "start_time": "2025-11-12T10:00:00Z"
}
```

---

### PATCH /games/{gameId}/sessions/{sessionId}

Update game session (end session, update state).

**Request Body**:
```json
{
  "end_time": "2025-11-12T10:05:00Z",
  "duration_seconds": 300,
  "game_state": {},
  "completion_status": "completed"
}
```

**Response** (200 OK):
```json
{
  "session_id": "uuid",
  "points_earned": 25,
  "new_balance": 125
}
```

---

## Points

### GET /points/balance

Get current point balance.

**Response** (200 OK):
```json
{
  "balance": 1000,
  "pending": 50
}
```

---

### GET /points/transactions

Get point transaction history.

**Query Parameters**:
- `type` (string, optional): Filter by type (earn, spend)
- `page` (integer, default 1)
- `limit` (integer, default 20)

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "earn",
      "amount": 50,
      "source": "game_play",
      "description": "Played game for 5 minutes",
      "balance_after": 1050,
      "created_at": "2025-11-12T10:00:00Z"
    }
  ],
  "pagination": {}
}
```

---

### GET /points/tasks

Get available point-earning tasks.

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "daily_checkin",
      "name": "Daily Check-in",
      "description": "Check in daily to earn points",
      "point_reward": 10,
      "is_completed": false,
      "cooldown_until": null
    }
  ]
}
```

---

### POST /points/tasks/{taskId}/complete

Complete a point-earning task.

**Response** (200 OK):
```json
{
  "points_earned": 10,
  "new_balance": 1010,
  "transaction_id": "uuid"
}
```

---

## Rewards

### GET /rewards

Get available rewards for redemption.

**Query Parameters**:
- `type` (string, optional): Filter by reward type
- `min_points` (integer, optional): Minimum point cost
- `max_points` (integer, optional): Maximum point cost

**Response** (200 OK):
```json
{
  "rewards": [
    {
      "id": "uuid",
      "name": "Membership Trial",
      "description": "7-day membership trial",
      "point_cost": 300,
      "reward_type": "membership_trial",
      "availability_status": "available",
      "stock_quantity": null
    }
  ]
}
```

---

### POST /rewards/{rewardId}/redeem

Redeem a reward with points.

**Request Body**:
```json
{
  "confirmation": true
}
```

**Response** (200 OK):
```json
{
  "redemption_id": "uuid",
  "points_spent": 300,
  "new_balance": 710,
  "delivery_status": "pending",
  "confirmation_code": "RED123456"
}
```

---

## Membership

### GET /membership

Get current membership status.

**Response** (200 OK):
```json
{
  "membership_status": "member",
  "plan_type": "monthly",
  "start_date": "2025-11-01T00:00:00Z",
  "expiration_date": "2025-12-01T00:00:00Z",
  "auto_renew": true
}
```

---

### GET /membership/plans

Get available membership plans.

**Response** (200 OK):
```json
{
  "plans": [
    {
      "plan_type": "monthly",
      "name": "Monthly Membership",
      "price": 6.00,
      "currency": "CNY",
      "duration_days": 30,
      "benefits": [
        "Ad-free experience",
        "30% point multiplier",
        "Priority access to new games"
      ]
    }
  ]
}
```

---

### POST /membership/subscribe

Subscribe to a membership plan.

**Request Body**:
```json
{
  "plan_type": "monthly",
  "payment_method": "wechat" | "alipay" | "apple_iap",
  "payment_data": {} // Payment provider-specific data
}
```

**Response** (200 OK):
```json
{
  "membership_id": "uuid",
  "payment_status": "pending",
  "payment_transaction_id": "string"
}
```

---

## Invitations

### GET /invitations

Get invitation statistics and history.

**Response** (200 OK):
```json
{
  "invitation_code": "ABC123",
  "invitation_link": "https://gamehub.com/invite/ABC123",
  "total_invited": 5,
  "active_invitees": 3,
  "total_rewards_earned": 500,
  "invitations": [
    {
      "invitee_id": "uuid",
      "registration_date": "2025-11-10T00:00:00Z",
      "milestones_completed": ["first_game_played"],
      "reward_status": "partial"
    }
  ]
}
```

---

### POST /invitations/generate

Generate new invitation link/code.

**Response** (200 OK):
```json
{
  "invitation_code": "XYZ789",
  "invitation_link": "https://gamehub.com/invite/XYZ789",
  "qr_code_url": "https://gamehub.com/qr/XYZ789"
}
```

---

## Recommendations

### GET /recommendations

Get personalized game recommendations.

**Query Parameters**:
- `scenario` (string, optional): Scenario context (commute, break_time, bedtime)
- `limit` (integer, default 10): Number of recommendations

**Response** (200 OK):
```json
{
  "recommendations": [
    {
      "game_id": "uuid",
      "game": {
        "id": "uuid",
        "title": "string",
        "cover_image_url": "string"
      },
      "recommendation_reason": "Similar to games you've played",
      "score": 0.85,
      "scenario_context": "commute"
    }
  ]
}
```

---

## Social

### GET /friends

Get friend list.

**Query Parameters**:
- `status` (string, optional): Filter by status (pending, accepted, blocked)

**Response** (200 OK):
```json
{
  "friends": [
    {
      "friend_id": "uuid",
      "nickname": "string",
      "avatar": "string",
      "status": "accepted",
      "last_active": "2025-11-12T09:00:00Z"
    }
  ]
}
```

---

### POST /friends/requests

Send friend request.

**Request Body**:
```json
{
  "friend_id": "uuid"
}
```

**Response** (201 Created):
```json
{
  "relationship_id": "uuid",
  "status": "pending"
}
```

---

### GET /leaderboards

Get leaderboards.

**Query Parameters**:
- `type` (string): Leaderboard type (points, invitations, game_{gameId})
- `timeframe` (string, optional): Timeframe (daily, weekly, monthly, all_time)

**Response** (200 OK):
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "nickname": "string",
      "avatar": "string",
      "score": 10000,
      "is_friend": false
    }
  ],
  "user_rank": 42,
  "user_score": 5000
}
```

---

## Collections

### GET /collections

Get user's game collections.

**Response** (200 OK):
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "My Favorites",
      "category": "favorites",
      "game_count": 10,
      "created_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

---

### POST /collections

Create a new collection.

**Request Body**:
```json
{
  "name": "Puzzle Games",
  "category": "puzzle"
}
```

**Response** (201 Created):
```json
{
  "collection_id": "uuid",
  "name": "Puzzle Games",
  "game_count": 0
}
```

---

### POST /collections/{collectionId}/games

Add game to collection.

**Request Body**:
```json
{
  "game_id": "uuid",
  "notes": "string"
}
```

**Response** (201 Created):
```json
{
  "item_id": "uuid",
  "collection_id": "uuid",
  "game_id": "uuid"
}
```

---

## Offline Games

### GET /offline/games

Get downloaded offline games.

**Response** (200 OK):
```json
{
  "games": [
    {
      "id": "uuid",
      "game_id": "uuid",
      "game": {
        "title": "string",
        "cover_image_url": "string"
      },
      "download_status": "completed",
      "file_size_bytes": 52428800,
      "version": "1.0.0",
      "last_played_date": "2025-11-11T00:00:00Z"
    }
  ],
  "storage_used": 524288000,
  "storage_quota": 1073741824
}
```

---

### POST /offline/games/{gameId}/download

Start downloading a game for offline play.

**Response** (202 Accepted):
```json
{
  "download_id": "uuid",
  "status": "pending",
  "estimated_size": 52428800
}
```

---

### DELETE /offline/games/{gameId}

Delete offline game to free storage.

**Response** (200 OK):
```json
{
  "freed_space": 52428800,
  "new_storage_used": 471859200
}
```

---

## Achievements

### GET /achievements

Get user achievements.

**Response** (200 OK):
```json
{
  "achievements": [
    {
      "id": "uuid",
      "achievement_type": "games_played",
      "name": "Game Enthusiast",
      "progress": 8,
      "target_value": 10,
      "is_unlocked": false,
      "badge_image_url": null
    }
  ],
  "total_unlocked": 5,
  "total_available": 20
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**Response** (4xx/5xx):
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `INSUFFICIENT_POINTS`: Not enough points for operation
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `STORAGE_QUOTA_EXCEEDED`: Offline storage quota exceeded
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting

- General API: 100 requests per minute per user
- Point-earning tasks: Frequency limits per task type
- Invitation generation: 10 per day per user

---

## WebSocket Events

### Real-time Notifications

**Connection**: `wss://api.gamehub.com/v1/ws`

**Events**:
- `friend_request`: New friend request received
- `achievement_unlocked`: Achievement unlocked
- `challenge_received`: Game challenge from friend
- `points_earned`: Points earned notification
- `invitation_reward`: Invitation reward notification

**Event Format**:
```json
{
  "event_type": "achievement_unlocked",
  "data": {
    "achievement_id": "uuid",
    "achievement_name": "Game Enthusiast"
  },
  "timestamp": "2025-11-12T10:00:00Z"
}
```

---

## Versioning

API versioning via URL path: `/v1/`, `/v2/`, etc.

Breaking changes require new version. Non-breaking changes (new endpoints, optional fields) can be added to existing version.

