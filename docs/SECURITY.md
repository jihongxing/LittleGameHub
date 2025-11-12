# Security Guidelines

## Security Hardening (Phase 11 - T246)

### Overview
This document outlines security measures implemented in GameHub to protect against common vulnerabilities and attacks.

---

## Authentication & Authorization

### JWT Token Security
```typescript
// backend/src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'], // Specify allowed algorithms
    });
  }
}
```

**Best Practices**:
- Use strong secret keys (256-bit minimum)
- Set reasonable expiration times (7 days for access tokens)
- Implement refresh token rotation
- Store tokens securely (HttpOnly cookies or secure storage)

### Password Security
```typescript
import * as bcrypt from 'bcrypt';

// Hash password with salt rounds
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Input Validation & Sanitization

### Request Validation
```typescript
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;
}
```

### XSS Prevention
- All user input is sanitized using `SanitizePipe`
- HTML/script tags are stripped
- Output encoding is enforced
- Content Security Policy (CSP) headers

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
```

### SQL Injection Prevention
- TypeORM parameterized queries
- Never use string concatenation for queries
- Use query builder for complex queries

```typescript
// SAFE: Parameterized query
const user = await this.userRepository.findOne({
  where: { email: userEmail },
});

// UNSAFE: Never do this
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

---

## Rate Limiting

### Global Rate Limiting
```typescript
// Applied to all routes
@UseGuards(RateLimitGuard)
export class AppController {
  // Routes protected by default
}
```

### Custom Rate Limits
```typescript
// Stricter limit for authentication
@Controller('auth')
export class AuthController {
  @Post('login')
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute
  async login(@Body() loginDto: LoginDto) {
    // Implementation
  }
}
```

### Rate Limit Configuration
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 60s |
| POST /auth/register | 3 | 300s |
| POST /points/earn | 100 | 60s |
| GET /games | 100 | 60s |
| POST /achievements/unlock | 50 | 60s |

---

## CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600, // Cache preflight for 1 hour
});
```

---

## Security Headers

### Helmet Configuration
```typescript
import * as helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
}));
```

---

## Data Protection

### Sensitive Data
- Passwords: Hashed with bcrypt
- API Keys: Encrypted at rest
- Personal Info: Encrypted in database
- Payment Data: Never stored (use payment gateway)

### Environment Variables
```bash
# Never commit .env files
# Use different configs per environment
# Rotate secrets regularly

# Example .env
JWT_SECRET=use_a_strong_random_secret_here
DB_PASSWORD=never_use_default_passwords
API_KEY=keep_this_secret
```

---

## File Upload Security

### Validation
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Invalid file type');
  }

  // Validate file size
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new BadRequestException('File too large');
  }

  // Sanitize filename
  const filename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Store with unique identifier
  const uniqueFilename = `${Date.now()}-${filename}`;

  return { filename: uniqueFilename };
}
```

---

## Database Security

### Connection Security
- Use SSL/TLS for database connections
- Implement connection pooling limits
- Use read-only users for read operations

```typescript
extra: {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  },
}
```

### Backup & Recovery
- Daily automated backups
- Encrypted backup storage
- Test recovery procedures
- Off-site backup location

---

## Logging & Monitoring

### Security Logging
```typescript
@Injectable()
export class SecurityLogger {
  logSuspiciousActivity(event: SecurityEvent) {
    this.logger.warn({
      type: 'SECURITY_EVENT',
      event,
      timestamp: new Date(),
      ip: event.ip,
      userId: event.userId,
    });
  }

  logFailedLogin(email: string, ip: string) {
    this.logger.warn({
      type: 'FAILED_LOGIN',
      email,
      ip,
      timestamp: new Date(),
    });
  }
}
```

### Events to Log
- Failed login attempts
- Unusual access patterns
- Permission violations
- API rate limit violations
- File upload attempts
- Database errors

---

## API Security

### Request Signing
```typescript
// Verify request signatures for critical operations
@Injectable()
export class SignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-signature'];
    const body = JSON.stringify(request.body);
    
    const expectedSignature = this.generateSignature(body);
    
    return signature === expectedSignature;
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', process.env.API_SECRET)
      .update(data)
      .digest('hex');
  }
}
```

---

## Frontend Security

### XSS Prevention
```typescript
// React automatically escapes content
<div>{userInput}</div> // Safe

// Be careful with dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### CSRF Protection
```typescript
// Use CSRF tokens for state-changing operations
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

### Secure Storage
```typescript
// Don't store sensitive data in localStorage
// Use httpOnly cookies for tokens
// Or use encrypted storage

// Bad
localStorage.setItem('token', jwtToken);

// Better
// Set token in httpOnly cookie on server
```

---

## Dependency Security

### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Security Scanning
```bash
# Use Snyk or similar
npx snyk test
```

---

## Penetration Testing

### Areas to Test
- [ ] Authentication bypass
- [ ] Authorization flaws
- [ ] SQL injection
- [ ] XSS attacks
- [ ] CSRF attacks
- [ ] API abuse
- [ ] Rate limit bypass
- [ ] File upload vulnerabilities

---

## Incident Response Plan

### 1. Detection
- Monitor logs and alerts
- User reports
- Security scanning tools

### 2. Assessment
- Determine severity
- Identify affected systems
- Document timeline

### 3. Containment
- Isolate affected systems
- Disable compromised accounts
- Apply emergency patches

### 4. Recovery
- Restore from backups if needed
- Verify system integrity
- Monitor for reoccurrence

### 5. Post-Incident
- Root cause analysis
- Update security measures
- Document lessons learned
- Notify affected users if required

---

## Compliance

### Data Protection
- GDPR compliance for EU users
- Data retention policies
- Right to deletion
- Data export capabilities

### Privacy Policy
- Clear data collection disclosure
- Cookie consent
- Third-party service disclosure
- User rights explanation

---

## Security Checklist

### Development
- [ ] Input validation implemented
- [ ] Output encoding enforced
- [ ] Authentication secure
- [ ] Authorization checked
- [ ] Secrets not in code
- [ ] Dependencies updated
- [ ] Security headers set

### Deployment
- [ ] HTTPS enforced
- [ ] Firewall configured
- [ ] Rate limiting active
- [ ] Monitoring enabled
- [ ] Backups automated
- [ ] Logs centralized
- [ ] Incident response plan

### Ongoing
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency updates
- [ ] Log review
- [ ] Access review
- [ ] Training provided

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

---

**Last Updated**: 2024-11-12
**Status**: Production Ready

