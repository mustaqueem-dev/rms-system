# RMS Backend — Security Hardening Reference

> **File**: `docs/SECURITY.md`  
> Covers all SRS NFR-S01 → NFR-S10 implementation notes.

---

## NFR-S01 — TLS 1.3 (Transport Security)

**Status**: Infrastructure level — not in application code.

**Implementation**:
- Configure the reverse-proxy / load-balancer (nginx / AWS ALB) to enforce **TLS 1.3 only**.
- All inter-service communication occurs inside the private VPC — plain HTTP is acceptable inside the cluster.
- Nginx snippet:
  ```nginx
  ssl_protocols TLSv1.3;
  ssl_prefer_server_ciphers off;
  add_header Strict-Transport-Security "max-age=63072000" always;
  ```

---

## NFR-S02 — PII Field-Level Encryption

**Status**: ✅ Implemented in `packages/shared-kernel/src/security/pii-crypto.ts`

**Implementation**:
- Algorithm: **AES-256-GCM** — authenticated encryption (guarantees integrity).
- Each call generates a unique 96-bit IV → ciphertext is non-deterministic.
- Output format: `hex(iv):hex(authTag):hex(ciphertext)` stored as a plain string field in MongoDB.
- HMAC-SHA256 `hash()` helper for equality-lookup indexes (search by encrypted phone without decrypting all records).

**Usage** (in a use-case that handles phone numbers):
```typescript
import { PiiCrypto } from '@rms/shared-kernel';

const encryptedPhone = PiiCrypto.encrypt(dto.guestPhone, process.env.PII_SECRET_KEY!);
// store encryptedPhone in MongoDB
const phone = PiiCrypto.decrypt(encryptedPhone, process.env.PII_SECRET_KEY!);
```

**Key management**: `PII_SECRET_KEY` — 64-char hex (32 bytes) — must be stored in **AWS Secrets Manager** / Vault in production. Never commit to .env files.

---

## NFR-S03 — OWASP ZAP in CI

**Status**: Phase 14 (CI/CD) — see `docs/CI.md` when implemented.

---

## NFR-S04 — JWT Expiry (15m access / 7d refresh)

**Status**: ✅ Verified across all services.

| Service      | Setting |
|--------------|---------|
| auth-service | `signOptions: { expiresIn: '15m' }` (access), `expiresIn: '7d'` (refresh) |
| api-gateway  | Validates expiry via `jsonwebtoken.verify()` |
| All services | JwtStrategy validated expiry on every protected route |

---

## NFR-S05 — Rate Limiting

**Status**: ✅ Implemented in `apps/api-gateway/src/gateway/middleware/rate-limit.middleware.ts`

- **120 requests / 60 seconds** per IP (configurable via `THROTTLE_LIMIT` + `THROTTLE_TTL` env).
- Keyed by `IP + x-user-id` when authenticated.
- Returns **HTTP 429** with `X-RateLimit-*` headers and `retryAfter` seconds in body.

---

## NFR-S06 — Input Sanitisation

**Status**: ✅ Implemented in `packages/shared-kernel/src/security/sanitisation.pipe.ts`

- `SanitisationPipe` strips HTML tags from all incoming string inputs recursively.
- Applied globally in every service's `main.ts` via `app.useGlobalPipes(new SanitisationPipe(), new GlobalValidationPipe())`.
- `GlobalValidationPipe` enforces `whitelist: true` and `forbidNonWhitelisted: true`.

---

## NFR-S07 — CORS Whitelist

**Status**: ✅ Implemented in `apps/api-gateway/src/main.ts`

- Configured via `CORS_ORIGINS` env var (comma-separated).
- `credentials: true` — required for cookie-based refresh tokens.
- Default `*` only for local development.

---

## NFR-S08 — PII Masking in Logs

**Status**: ✅ Implemented in `packages/shared-kernel/src/interceptors/logging.interceptor.ts`

- Fields masked: `email`, `phone`, `password`, `token`, `secret`, `creditCard`, `ssn`
- Request **body** and **headers** are deep-scanned recursively (max depth 5) before logging.
- All sensitive values replaced with `***`.

---

## NFR-S09 — AWS Secrets Manager

**Status**: Production deployment concern — not in application code.

**Pattern**:
```typescript
// In each service's config module, at startup:
const client = new SecretsManagerClient({ region: 'ap-south-1' });
const secret = await client.send(new GetSecretValueCommand({ SecretId: 'rms/prod' }));
const config = JSON.parse(secret.SecretString!);
process.env.JWT_SECRET  = config.jwtSecret;
process.env.MONGO_URI   = config.mongoUri;
```

---

## NFR-S10 — Audit Logs for Write Operations

**Status**: ✅ Implemented in `packages/shared-kernel/src/security/audit-log.interceptor.ts`

- Fires on all **POST, PATCH, PUT, DELETE** requests.
- Captures: `userId`, `role`, `branchId`, `franchiseId`, `method`, `path`, `statusCode`, `ip`, `traceId`, `timestamp`.
- PII-safe: uses the same `maskPii()` function as `LoggingInterceptor`.
- Apply as a global interceptor: `app.useGlobalInterceptors(new AuditLogInterceptor())`.
- Production: pipe logs to a SIEM (e.g., AWS CloudWatch + ElasticSearch) for tamper-evident audit trail.
