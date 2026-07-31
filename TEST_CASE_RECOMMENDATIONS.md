# SalesSync Test Case Recommendations

## Scope and approach

This catalog is based on the implemented FastAPI routers, services, schemas, models,
React routes, Redux thunks/state, shared API client, database migrations, and external
integration adapters. Automated coverage is implemented with Playwright, Pytest/HTTPX, and Postman.

Priority:

- **P0**: security, data isolation, money, authentication, or a core workflow blocker
- **P1**: primary feature behavior and important failures
- **P2**: secondary UX, resilience, compatibility, and performance

Recommended levels:

- **Unit**: pure validation, security helpers, reducers, formatting, transition rules
- **API**: FastAPI + isolated test database, with external services mocked
- **Contract**: frontend request/response shape checked against backend OpenAPI
- **E2E**: browser workflow across frontend and backend

Test types:

- **Positive**: valid input, permissions, and state produce the expected successful result
- **Negative**: invalid, missing, malformed, duplicate, unauthorized, or conflicting input is rejected safely
- **Boundary**: values at or beyond supported limits
- **Security**: authentication, authorization, tenant isolation, injection, and data exposure
- **Concurrency**: simultaneous or repeated operations
- **Resilience**: provider, network, storage, or dependency failures
- **Compatibility**: contracts, migrations, browsers, responsive layouts, and accessibility

## 1. Application shell, navigation, and marketing

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| APP-01 | P1 | E2E | Positive | Open landing page while signed out | Marketing page loads with working login, register, pricing, and CTA links |
| APP-02 | P2 | E2E | Positive | Navigate between landing and pricing pages | Correct page and active navigation render without full-page errors |
| APP-03 | P1 | E2E | Positive | Open every sidebar route while authenticated | Dashboard, leads, qualification, outreach, meetings, proposals, knowledge base, team, settings, and billing render |
| APP-04 | P1 | E2E | Negative | Open an unknown route | Branded 404 appears and navigation back to a valid page works |
| APP-05 | P1 | Component | Negative / Resilience | Force a route render error, then click retry | Error boundary renders safely and retry/reset executes |
| APP-06 | P1 | E2E | Negative | Open protected route while signed out | Redirects to login and preserves intended destination |
| APP-07 | P1 | E2E | Positive | Login through a preserved redirect | User returns to originally requested protected route |
| APP-08 | P1 | E2E | Positive | Reload protected route with persisted valid token | Session hydrates without premature redirect |
| APP-09 | P0 | E2E | Negative | Reload with expired, malformed, or `"undefined"` token | Session is cleared or user is sent to login; no infinite loading state |
| APP-10 | P1 | E2E | Positive | User has no teams, one team, and multiple teams | No team goes to setup; one auto-selects; multiple require selection |
| APP-11 | P1 | E2E | Positive | Switch active team | All team-scoped stores reload; old-team data never flashes or remains actionable |
| APP-12 | P2 | E2E | Positive | Resize desktop/tablet/mobile and use sidebar/chat toggles | Responsive sidebar, overlay, top bar, and AI panel remain usable |
| APP-13 | P2 | Accessibility | Positive / Compatibility | Keyboard-only navigation across shell | Focus is visible, order is logical, dialogs trap focus, controls have names |
| APP-14 | P2 | Accessibility | Positive / Compatibility | Screen-reader scan of primary pages | Headings, landmarks, labels, error messages, tables, and status changes are announced |
| APP-15 | P2 | Visual | Positive / Boundary / Compatibility | Test 320px, 768px, 1280px, and 1920px viewports | No clipped dialogs, horizontal overflow, overlapping controls, or unreadable tables |

## 2. Authentication, registration, OTP, and session

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| AUTH-01 | P0 | API/E2E | Positive | Register with valid name, email, and password | User is created once, password is hashed, verification is required, OTP is requested |
| AUTH-02 | P1 | API | Negative | Register duplicate email with different casing | Duplicate is rejected consistently; no second account |
| AUTH-03 | P1 | API | Negative | Register malformed email | 422 standardized error; no user created |
| AUTH-04 | P1 | API | Negative | Register empty/whitespace name or password | Validation rejects invalid values; whitespace-only identity is not stored |
| AUTH-05 | P0 | Unit/API | Positive / Boundary | Password at 72 bcrypt bytes and 73 bytes, including multibyte Unicode | 72 bytes accepted; over 72 rejected with safe validation error |
| AUTH-06 | P1 | E2E | Positive | Toggle password visibility on login/register | Value is preserved and input type toggles |
| AUTH-07 | P1 | E2E | Negative | Submit registration without accepting terms | Submission is blocked and accessible validation is shown |
| AUTH-08 | P0 | API/E2E | Positive / Security | Login verified account with correct credentials | Valid access token and refresh cookie/session data returned |
| AUTH-09 | P0 | API | Negative | Login with wrong password or unknown email | Same generic 401 behavior prevents account enumeration |
| AUTH-10 | P0 | API/E2E | Positive | Login unverified account | No access token; `needs_verification` and email route user to OTP page |
| AUTH-11 | P1 | E2E | Negative | OTP digit typing, backspace, arrows, paste six digits, paste invalid text | Focus movement and sanitization work; only six numeric digits submit |
| AUTH-12 | P0 | API | Positive | Verify correct OTP before expiry | Email becomes verified and OTP is deleted so it cannot be reused |
| AUTH-13 | P0 | API | Negative / Positive | Verify wrong, expired, missing, or already-used OTP | Request fails without verifying account |
| AUTH-14 | P0 | API | Negative | Request OTP for unknown email | Behavior is intentionally non-enumerating, or documented 400 is consistently enforced |
| AUTH-15 | P0 | API | Negative / Resilience | Redis unavailable during OTP request/verify | Controlled standardized 5xx; user verification state is unchanged |
| AUTH-16 | P1 | API | Negative / Resilience | Resend provider fails after registration/request | Registration remains consistent; retry is possible; secret OTP is not logged |
| AUTH-17 | P0 | Security | Positive / Security | Repeated OTP requests and guesses | Rate limit/lockout prevents brute force and resend abuse |
| AUTH-18 | P0 | Unit/API | Negative / Positive / Security | JWT valid, expired, wrong signature, missing `sub`, non-UUID `sub` | Only valid token authenticates; failures return 401 with WWW-Authenticate |
| AUTH-19 | P0 | API | Negative | Token references a deleted user | 401 “user not found”; no protected data returned |
| AUTH-20 | P1 | API/E2E | Positive | Logout | 204 response is handled, local state/tokens are cleared, protected page becomes inaccessible |
| AUTH-21 | P0 | Security | Positive / Security | Refresh cookie flags and CORS credential behavior | Cookie uses HttpOnly/Secure/SameSite appropriate to environment and allowed origins only |
| AUTH-22 | P1 | E2E | Negative / Positive / Resilience | Google sign-in success, popup denial, invalid token, userinfo failure | Success signs in through supported backend flow; all failures show actionable error without fake session |

## 3. Teams, invitations, roles, and tenant isolation

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| TEAM-01 | P1 | API/E2E | Positive | Create team with valid name | Team, unique invite code, and admin membership are created atomically |
| TEAM-02 | P1 | API | Negative / Positive / Boundary | Create team with empty/whitespace/very long name | Invalid names rejected or normalized to documented limits |
| TEAM-03 | P1 | API | Positive | User who already belongs to a team creates/joins another | Current one-team membership rule is enforced consistently |
| TEAM-04 | P1 | API/E2E | Positive | Join using valid invite code and invite-code URL parameter | Membership is created and active team loads |
| TEAM-05 | P1 | API | Negative / Positive | Join with invalid, expired-looking, lowercase, spaced, or reused code | Canonicalization is defined; invalid code fails without partial membership |
| TEAM-06 | P1 | API | Positive | Existing member joins same team again | Duplicate membership is rejected without server error |
| TEAM-07 | P1 | API/E2E | Positive | List current user teams | Only memberships belonging to user return, with correct role |
| TEAM-08 | P0 | API | Negative / Positive / Security | Get/update/delete a team as nonmember | 403/404 without leaking team data |
| TEAM-09 | P1 | API/E2E | Positive | Rename team as admin, manager, and rep | Only intended roles succeed; list/header refresh to new name |
| TEAM-10 | P0 | API/E2E | Positive | Delete team as admin | Team and intended dependents are removed atomically; active UI session recovers |
| TEAM-11 | P0 | API | Negative / Positive / Security | Delete team as manager/rep/nonmember | 403; team and children remain |
| TEAM-12 | P1 | API/E2E | Positive | Invite valid email | Invitation uses correct team/name/code/link and UI confirms delivery attempt |
| TEAM-13 | P1 | API | Negative | Invite malformed email, existing member, or while inviter has no team | Controlled 4xx; no email or membership mutation |
| TEAM-14 | P1 | API | Negative / Resilience | Email provider fails while inviting | Failure behavior is explicit; no false “invite sent” state |
| TEAM-15 | P0 | API | Positive | Admin changes member among admin/manager/rep | Valid enum persists and response reflects membership |
| TEAM-16 | P0 | API | Positive | Manager/rep changes a role | 403 and target role unchanged |
| TEAM-17 | P0 | API | Positive | Change own role or demote the last admin | Operation is rejected if it would leave team unmanaged |
| TEAM-18 | P0 | API | Positive | Admin removes another member | Membership removed; member immediately loses team access |
| TEAM-19 | P0 | API | Negative / Security | Remove self, last admin, nonexistent member, or member from another team | Safe, documented behavior; no cross-team deletion |
| TEAM-20 | P0 | API | Negative / Security | Fetch invite code as each role/nonmember | Only intended roles receive it; nonmember cannot enumerate |
| TEAM-21 | P0 | API | Positive | Send mismatched path team ID and `X-Team-Id` | Authorization is based on the same target team; cross-team operation denied |
| TEAM-22 | P0 | API | Negative / Security | Access every team-scoped resource using another team’s object UUID | Every read/write/delete returns 403/404 and never exposes object existence/details |
| TEAM-23 | P0 | API | Negative | Missing, malformed, or unknown `X-Team-Id` | Missing=422, malformed=400, nonmembership=403 consistently |
| TEAM-24 | P0 | Concurrency | Positive / Concurrency | Two users join or edit roles simultaneously | Unique constraints hold; no duplicate membership or lost update |

## 4. Onboarding and ICP generation

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| ICP-01 | P1 | API/E2E | Positive | Submit all onboarding fields | AI-generated ICP saves to active team and completed=true |
| ICP-02 | P1 | API | Positive | Omit optional product name | Generation succeeds using remaining required context |
| ICP-03 | P1 | API/E2E | Negative / Boundary | Required field empty, whitespace, huge, Unicode, or HTML/script text | Validation/limits apply; output renders as text, not executable HTML |
| ICP-04 | P1 | API | Negative / Resilience | AI key missing, timeout, rate limit, malformed JSON, or empty choices | Controlled error, no corrupt/partial ICP stored, retry works |
| ICP-05 | P1 | API | Positive | Retrieve status before and after ICP creation | Correct `completed` and ICP values returned |
| ICP-06 | P1 | API | Positive | GET ICP when none exists | Documented 404 response |
| ICP-07 | P1 | API/E2E | Positive | Update existing ICP | New value persists only for active team |
| ICP-08 | P1 | API/E2E | Positive | Delete ICP | Value clears and status becomes incomplete |
| ICP-09 | P0 | API | Positive | Rep performs create/update/delete if endpoint requires manager/admin | RBAC matches product intent and router dependencies |
| ICP-10 | P1 | Concurrency | Positive / Concurrency | Submit onboarding twice rapidly | No duplicate side effects; latest/defined request wins |

## 5. Leads and qualification

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| LEAD-01 | P1 | API/E2E | Positive / Boundary | Create lead with all fields and minimum name only | Defaults apply; created lead appears in active team |
| LEAD-02 | P1 | API | Negative / Boundary | Empty name, invalid email, oversized fields, negative/>100 score | Schema/business limits reject invalid prospect data |
| LEAD-03 | P1 | API | Positive / Security | Create same email twice in same/different teams | Intended deduplication rule is enforced per tenant |
| LEAD-04 | P1 | API | Positive | Get/list leads and filter each valid status | Correct team subset, ordering, fields, and status filtering |
| LEAD-05 | P1 | API | Negative | Invalid or case-variant status filter | Documented empty/400 behavior; never server error |
| LEAD-06 | P1 | E2E | Positive | Search name, company, title, email, and reasoning | Case-insensitive matching and empty state are correct |
| LEAD-07 | P2 | E2E | Positive | Filter by source and combine with search | Intersection is correct and clearing filters restores list |
| LEAD-08 | P2 | E2E | Negative / Boundary | Pagination previous/next at first, middle, last, and empty pages | Buttons and result range are correct |
| LEAD-09 | P1 | API | Positive | Patch each mutable lead field independently and together | Only supplied fields change; omitted fields remain |
| LEAD-10 | P1 | API | Positive | Generic status/score/reasoning update | Valid values persist and AI context is merged, not unintentionally erased |
| LEAD-11 | P1 | API/E2E | Positive | Qualify analyzed/new lead | Status becomes Qualified and UI moves it to intended workflow |
| LEAD-12 | P1 | API/E2E | Positive | Discard lead | Status becomes Discarded and UI reflects removal/filter |
| LEAD-13 | P1 | API | Negative | Repeat qualify/discard and attempt invalid transitions | Idempotency/transition rules are explicit and enforced |
| LEAD-14 | P1 | API | Negative / Positive / Resilience | Qualify with AI success, low score, malformed result, and provider failure | Score/reasoning/status update consistently or roll back fully |
| LEAD-15 | P1 | API/E2E | Positive | Delete lead with related email/meeting/proposal | Actual FK behavior matches intended cascade/set-null rules |
| LEAD-16 | P0 | API | Negative / Security | Read/update/qualify/discard/delete another team’s lead UUID | Denied without mutation or leakage |
| LEAD-17 | P1 | Contract | Positive / Compatibility | Frontend sends `status`, `score`, `reasoning` during create | Contract detects that backend `LeadCreate` currently ignores/rejects these fields rather than silently losing UI state |
| LEAD-18 | P2 | Performance | Positive / Boundary | List/search thousands of leads | Response and table interaction stay within agreed latency; query is indexed/paginated |

## 6. Outreach, drafts, Gmail, and email history

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| MAIL-01 | P1 | E2E | Positive | Select qualified lead for outreach | Correct recipient/profile/history loads |
| MAIL-02 | P1 | E2E | Positive | Edit subject/body/tone and use undo/redo buttons and shortcuts | History boundaries, redo invalidation, and field values are correct |
| MAIL-03 | P1 | API/E2E | Positive | Save draft | Draft persists with lead, subject, body, metadata and appears in history |
| MAIL-04 | P1 | API | Negative | Draft for missing or other-team lead | 404/403; no email created |
| MAIL-05 | P1 | API | Positive | AI draft generation across tone options | Prompt contains correct lead/team context and usable content is stored |
| MAIL-06 | P1 | API | Negative / Resilience | AI provider missing/timeout/malformed response | Controlled failure; editor content remains recoverable |
| MAIL-07 | P0 | API/E2E | Positive | Send valid email with connected Gmail | Gmail called once, email marked sent with `sent_at`, lead status advances as intended |
| MAIL-08 | P0 | API | Negative / Security | Gmail not connected or credentials missing | Send fails clearly; record is not falsely marked sent |
| MAIL-09 | P0 | API | Negative / Positive | Expired Gmail access token with valid refresh token | Token refreshes, encrypted credentials update, send retries once |
| MAIL-10 | P0 | API | Negative | Token refresh or Gmail send fails | Failure is recorded/logged safely; email/lead state stays truthful |
| MAIL-11 | P0 | API | Positive / Concurrency / Resilience | Rapid double-click send / retry after ambiguous timeout | At-most-once behavior or idempotency prevents duplicate customer email |
| MAIL-12 | P1 | API | Positive | List all emails and filter by lead | Correct team ownership and chronological order |
| MAIL-13 | P1 | API | Positive | Get/patch/delete draft | Allowed fields persist; delete removes only requested draft |
| MAIL-14 | P0 | API | Positive | Patch/delete an already-sent email | Immutable audit data cannot be silently rewritten/deleted unless explicitly allowed |
| MAIL-15 | P0 | Security | Positive / Security | CRLF in subject, HTML/script body, malicious links/attachments | Header injection blocked and UI safely renders untrusted content |
| MAIL-16 | P1 | API/E2E | Positive | Gmail OAuth auth URL and successful callback | State binds callback to initiating user; credentials encrypted; connected status true |
| MAIL-17 | P0 | Security | Negative / Security | OAuth callback missing/wrong/replayed state or wrong user | Rejected; credentials never attached to attacker/victim |
| MAIL-18 | P1 | E2E | Negative | OAuth popup/callback error or user denial | Settings reports failure and remains disconnected |
| MAIL-19 | P0 | Security | Positive / Security | Inspect logs/API/database serialization | Access/refresh tokens and API keys never appear in responses or logs |

## 7. Meetings and Cal.com

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| MEET-01 | P1 | API | Positive | Create meeting with valid lead/date/time/timezone/agenda/notes | Meeting is linked to correct team and creator with Scheduled status |
| MEET-02 | P1 | API | Negative | Missing lead, nonexistent lead, or other-team lead | Required/404/403 response; no meeting |
| MEET-03 | P1 | API | Negative | Invalid date/time/timezone and past time | Validation follows scheduling policy |
| MEET-04 | P1 | Contract | Positive / Compatibility | Submit frontend meeting payload (`client`, `company`, optional `lead_id`, `duration`, agenda array) | Contract test exposes mismatch with backend-required `lead_id` and string agenda |
| MEET-05 | P1 | API | Positive | List/get meetings | Only active-team meetings return in deterministic chronological order |
| MEET-06 | P1 | API/E2E | Positive | Update date, time, timezone, agenda, notes, calendar event ID | Only supplied fields persist and UI refreshes |
| MEET-07 | P1 | API | Negative | Exercise Scheduled→Live→Completed/Cancelled/No-Show and invalid status | Allowed transitions persist; invalid values/transitions rejected |
| MEET-08 | P1 | Contract | Positive / Compatibility | Send frontend `transcript` update | Contract detects unsupported backend field instead of silently dropping transcript |
| MEET-09 | P1 | API/E2E | Positive | Delete meeting | Correct meeting removed; unrelated calendar/lead data remains |
| MEET-10 | P0 | API | Negative / Security | Cross-team get/update/delete meeting | Denied |
| MEET-11 | P1 | API | Positive | Save valid Cal.com key/event type | Encrypted team/user credentials persist and secret is not returned |
| MEET-12 | P1 | API | Negative / Resilience | Invalid/revoked Cal.com key or provider unavailable | Clear error and previous valid configuration remains |
| MEET-13 | P2 | E2E | Positive | Select meeting and render agenda/notes/status | Empty, populated, and long content render safely and responsively |

## 8. Proposals and templates

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| PROP-01 | P1 | API | Positive | Create proposal with valid file URL and optional metadata/lead/template | Draft/Open proposal version 1 persists |
| PROP-02 | P1 | API | Negative / Boundary | Invalid/missing file URL, negative size, bad UUID, wrong-team lead/template | Validation/ownership error; no proposal |
| PROP-03 | P1 | Contract | Positive / Compatibility | Submit frontend proposal fields (`company`, `title`, `summary`, `value`) | Contract flags mismatch with backend file-based `ProposalCreate` |
| PROP-04 | P1 | API | Negative / Positive / Security | List/get proposals with/without related lead | Correct tenant data and presigned URL returned |
| PROP-05 | P1 | API | Positive | Patch file/template/metadata fields | Versioning behavior is consistent and only supplied fields change |
| PROP-06 | P1 | Contract | Positive / Compatibility | Submit frontend patch fields (`title`, `summary`, `value`, `status`, `outcome`) | Contract flags unsupported fields instead of silent loss |
| PROP-07 | P0 | API | Negative / Positive | Update each valid status and invalid/case-variant status | Only Draft/Sent/Under Review/Accepted/Rejected accepted |
| PROP-08 | P1 | API | Positive | Status update timestamps | Sent sets `sent_at`; response statuses set `responded_at` according to rule |
| PROP-09 | P0 | API | Negative / Positive | Update Open→Won/Lost and invalid outcome | Only valid outcomes accepted; timestamps/status remain coherent |
| PROP-10 | P1 | E2E | Positive | Proposal search, status display, metrics, compact/full action cards | Counts and visible rows derive from actual API fields |
| PROP-11 | P1 | API/E2E | Positive | Delete proposal | Proposal removed; template and unrelated lead remain |
| PROP-12 | P0 | API | Negative / Security | Cross-team proposal CRUD/status/outcome | Denied |
| PROP-13 | P0 | Contract/API | Positive / Compatibility | GET/PUT `/proposals/template` and POST `/proposals/template/upload` | Static routes resolve and are not captured by earlier `/{proposal_id}` UUID route |
| PROP-14 | P1 | API | Positive | Get template when absent | Documented null/404 behavior that frontend handles |
| PROP-15 | P1 | API/E2E | Positive | Upload first template and replace existing template | Supported file persists in S3, metadata/name update, old-file policy is enforced |
| PROP-16 | P0 | Security | Negative / Positive / Boundary / Security | Upload executable, spoofed MIME, path traversal filename, empty or oversized file | Rejected/sanitized; no unsafe object key or stored executable |
| PROP-17 | P1 | API | Negative / Resilience | S3 upload/presign failure | Transaction rolls back or asset is marked accurately; no broken success response |
| PROP-18 | P0 | Contract | Positive / Compatibility | POST `/proposals/{id}/revisions` from frontend | Test fails until backend implements endpoint or frontend removes call |
| PROP-19 | P1 | API | Positive | Revision creation increments version atomically and preserves history | Sequential revision numbers and editor/note/content are accurate |
| PROP-20 | P1 | Concurrency | Positive / Concurrency | Two simultaneous revisions/status changes | No duplicate version, lost update, or contradictory final state |
| PROP-21 | P0 | Security | Positive / Security | Presigned proposal/template URL | Short-lived, scoped to correct object, unusable after expiry, no bucket leakage |

## 9. Knowledge base, extraction, vector search, and RAG

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| KB-01 | P1 | API/E2E | Positive | Upload supported PDF, DOCX, and text files | Asset created, sanitized filename stored, extraction/indexing completes, UI status updates |
| KB-02 | P1 | API | Negative / Positive / Boundary / Security | Upload empty, corrupt, encrypted, unsupported, MIME-spoofed, or oversized file | Controlled rejection/failure state; no unsafe processing |
| KB-03 | P0 | Security | Negative / Boundary / Security | Filename traversal, Unicode filename, duplicate filename | Object key stays tenant-scoped/safe and collisions do not overwrite |
| KB-04 | P1 | API | Positive | Upload title/description and comma-separated tags | Tags normalize correctly; metadata round-trips |
| KB-05 | P1 | API | Negative / Resilience | S3, extractor, Pinecone, or embedding provider fails at each stage | Accurate Processing/Failed state and error; DB/S3/vector cleanup is consistent |
| KB-06 | P1 | API | Positive | List/get assets | Correct team only, deterministic order, presigned URLs and processing fields |
| KB-07 | P1 | E2E | Positive | Search source library by title/description/tags | Correct case-insensitive results and empty state |
| KB-08 | P1 | API | Negative | Patch title/description/tags including clear-to-empty | Supplied values persist without disturbing file/vector identity |
| KB-09 | P1 | API | Positive | Delete indexed asset | DB row, vector chunks, and S3 object follow documented deletion policy |
| KB-10 | P0 | API | Negative / Security | Cross-team list/get/patch/delete/search/ask | No asset, chunk, content, or source metadata crosses tenants |
| KB-11 | P1 | API | Positive | Semantic search with relevant query and limit 1/5/max | Ranked sources, score, content, title, and chunk indexes are correct |
| KB-12 | P1 | API | Negative / Boundary | Empty/whitespace query, zero/negative/huge limit | Input validation prevents waste/abuse |
| KB-13 | P1 | API | Positive | Ask question with indexed evidence | Answer is grounded and citations map to returned chunks/assets |
| KB-14 | P1 | API | Negative | Ask with no relevant sources or AI failure | Honest no-answer/controlled error; no fabricated citation |
| KB-15 | P0 | Security | Positive / Security | Prompt injection inside uploaded document | System boundaries hold; model does not expose secrets or other-tenant context |
| KB-16 | P0 | Security | Positive / Security | Malicious PDF/DOCX decompression bomb or parser exploit fixture | Resource limits/timeouts contain processing safely |
| KB-17 | P2 | Performance | Positive | Large document and large team corpus | Upload returns within design, background processing is bounded, search meets latency target |

## 10. AI chat and agents

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| CHAT-01 | P1 | API/E2E | Positive | Send normal message | User and AI messages persist once, reply renders, “Thinking…” is replaced |
| CHAT-02 | P1 | API | Negative / Boundary | Empty/whitespace/very long/Unicode message | Limits and validation prevent empty or abusive calls |
| CHAT-03 | P1 | API | Positive | List/get history | Active-team messages return in defined chronological order with metadata |
| CHAT-04 | P1 | API/E2E | Positive | Patch own message | Allowed edit persists and UI/history refreshes |
| CHAT-05 | P0 | API | Positive / Security | Patch another user’s or AI message | Authorization/product rule blocks unauthorized history rewriting |
| CHAT-06 | P1 | API/E2E | Positive | Delete permitted message | Correct row removed and remaining order stable |
| CHAT-07 | P0 | API | Negative / Security | Cross-team message get/patch/delete by UUID | Denied |
| CHAT-08 | P1 | API/E2E | Negative / Resilience | AI timeout, missing key, rate limit, malformed response | Friendly error replaces spinner; user message/audit state follows defined policy |
| CHAT-09 | P1 | Concurrency | Positive / Concurrency | Send multiple messages rapidly | Replies correlate to requests and ordering remains deterministic |
| CHAT-10 | P0 | Security | Negative / Security | Prompt asks for secrets, system prompt, or another team’s data | No secret/cross-tenant disclosure |
| CHAT-11 | P0 | Security | Positive / Security | Stored XSS/Markdown payload in user or model response | UI renders safely without script execution |
| CHAT-12 | P2 | API | Positive | Verify metadata token count/model/latency logging | Metadata is accurate but contains no credentials or sensitive prompt data |

## 11. Billing and Stripe

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| BILL-01 | P0 | API/E2E | Positive | Get billing status with no subscription and active/cancelled/past-due subscriptions | Correct tier, status, end date, cancel flag render |
| BILL-02 | P0 | API | Positive | Create checkout for growth and enterprise | Correct configured price, team/customer metadata, success/cancel URLs |
| BILL-03 | P0 | API | Negative | Invalid tier or missing Stripe price configuration | 4xx/controlled error; no checkout |
| BILL-04 | P0 | API/E2E | Positive | Checkout success/cancel return | UI refreshes status only from trusted backend/webhook, not query string |
| BILL-05 | P0 | API | Positive | Valid signed webhook for checkout/subscription create/update/delete | Team subscription fields become exactly event state |
| BILL-06 | P0 | Security | Negative / Security | Missing/invalid webhook signature, modified payload | 400; no billing mutation |
| BILL-07 | P0 | API | Negative | Duplicate and out-of-order webhook delivery | Idempotent handling; older event cannot regress newer state |
| BILL-08 | P0 | API | Negative | Webhook contains missing/unknown/malicious team metadata | Safely ignored/rejected; never updates another team |
| BILL-09 | P0 | API/E2E | Positive | Cancel active subscription | Stripe cancel-at-period-end set once and status reflects effective end |
| BILL-10 | P0 | API | Negative / Resilience | Cancel with no subscription, already cancelled, provider failure | Idempotent/documented response and truthful local state |
| BILL-11 | P0 | API | Negative / Security | Nonmember/unauthorized role starts checkout or cancels | RBAC blocks money-affecting action |
| BILL-12 | P0 | Security | Positive / Security | Price/tier/customer identifiers supplied by client manipulation | Server chooses trusted price and team/customer ownership |
| BILL-13 | P2 | E2E | Positive / Concurrency / Compatibility | Upgrade button double-click and return navigation | Button disables while pending and creates at most one checkout session |

## 12. API conventions, resilience, security, and data layer

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| CORE-01 | P1 | API | Negative / Positive / Resilience | Health endpoint with healthy and unavailable database | Meaningful status without exposing credentials |
| CORE-02 | P1 | Contract | Positive / Compatibility | Every success response against declared `ApiResponse` shape | `success/message/data/error` contract is consistent, except explicitly documented raw integration responses |
| CORE-03 | P1 | Contract | Positive / Compatibility | 400/401/403/404/422/500 handlers | Frontend can extract useful message from standardized body |
| CORE-04 | P0 | Security | Positive / Security | Unexpected exception in production | Generic 500 response; no stack trace, SQL, path, token, or secret leakage |
| CORE-05 | P0 | Security | Negative / Security | CORS allowed origin, unknown origin, null origin, preflight | Only configured origins/methods/headers allowed; credentials policy correct |
| CORE-06 | P0 | Security | Positive / Security | SQL/JSON/HTML injection strings in every text field/query | Treated as data; no query manipulation or execution |
| CORE-07 | P0 | Security | Positive / Security | UUID enumeration and response timing across tenants | No object leakage through content/status differences beyond documented policy |
| CORE-08 | P1 | API | Negative / Compatibility | Unknown JSON fields across create/update schemas | Consistent reject-or-ignore policy; contract tests catch silent data loss |
| CORE-09 | P1 | API | Negative | Wrong content type, malformed JSON, empty body, duplicate keys | Controlled 4xx; no mutation |
| CORE-10 | P0 | Concurrency | Positive / Concurrency / Resilience | Retry create/update after connection loss | Transaction atomicity and idempotency prevent duplicates/partial writes |
| CORE-11 | P1 | DB | Negative / Compatibility | Upgrade empty DB through all Alembic migrations | Schema creates successfully and app starts |
| CORE-12 | P1 | DB | Positive / Compatibility | Upgrade a pre-OTP/pre-RAG/pre-billing DB | Existing data preserved and new defaults/constraints valid |
| CORE-13 | P1 | DB | Positive / Compatibility | ORM metadata versus Alembic schema diff | No unexpected drift from startup `create_all` |
| CORE-14 | P0 | DB | Positive | Delete user/team/lead/proposal and verify actual cascades | FK behavior matches documented product requirements |
| CORE-15 | P2 | Performance | Positive / Concurrency | Concurrent list/search/chat/upload requests | Pool limits, timeouts, and latency remain acceptable; no starvation |
| CORE-16 | P2 | Observability | Positive | Trigger external-service and DB errors | Correlation/context logs exist, but PII/secrets/OTP/body content follow redaction policy |
| CORE-17 | P0 | Dependencies | Positive | Security scan locked Python and npm dependencies | No unaccepted critical/high vulnerabilities |

## 13. Frontend state, error handling, and usability

| ID | Pri | Level | Type | Test case | Expected result |
|---|---|---|---|---|---|
| UI-01 | P1 | Unit | Negative | Redux pending/fulfilled/rejected for every thunk | Loading flags terminate, success data normalizes, errors remain actionable |
| UI-02 | P0 | Unit/E2E | Positive | Switch teams while previous team requests are in flight | Late old-team responses cannot overwrite new-team state |
| UI-03 | P1 | E2E | Negative / Security / Resilience | API offline, DNS/CORS failure, timeout, and non-JSON error | Friendly error appears and retry is possible |
| UI-04 | P1 | E2E | Positive | 401 from any protected API after initial load | Token/session clears and user returns to login with redirect |
| UI-05 | P0 | E2E | Positive | 403 from stale role/team membership | UI removes restricted actions/data and prompts team/session refresh |
| UI-06 | P1 | E2E | Negative | Empty, loading, populated, and failed state for each list page | Skeleton/empty/error/content state is distinct and stable |
| UI-07 | P1 | E2E | Positive | Double-submit all forms/actions | Buttons disable or operations are idempotent; no duplicate rows/emails/payments |
| UI-08 | P1 | E2E | Negative / Positive / Security | Close/reopen form dialogs after error/success | State resets appropriately and stale error/file does not leak |
| UI-09 | P1 | E2E | Negative / Resilience | Local storage unavailable/corrupt | App fails safely without blank screen |
| UI-10 | P2 | E2E | Positive / Compatibility | Browser back/forward through auth, dialogs, filters, and team selection | Navigation and state remain predictable |
| UI-11 | P2 | International | Positive / Compatibility | Long names, RTL text, emoji, locale dates/times, DST boundaries | Content remains usable and dates are not shifted incorrectly |
| UI-12 | P2 | Accessibility | Negative / Compatibility | Validation error, toast, async completion, modal open/close | Status is announced and focus moves/restores correctly |

## Immediate contract blockers to test first

These are implementation mismatches visible in the current code and should become
failing tests before feature-level automation expands:

1. **Proposal revisions:** the frontend posts to
   `/proposals/{proposal_id}/revisions`, but no backend route implements it.
2. **Proposal create/update:** the frontend sends company/title/summary/value while
   backend schemas accept file URL/type/size/template/AI metadata.
3. **Meeting create/update:** the frontend allows optional lead ID and sends
   client/company/duration/agenda arrays/transcript, while the backend requires a lead
   ID and defines agenda as a string with no transcript field.
4. **Proposal template route precedence:** `/proposals/{proposal_id}` is registered
   before `/proposals/template`; verify that “template” is not parsed as a UUID and
   rejected before reaching the static handler.
5. **Lead create enrichment:** frontend creation can include status/score/reasoning,
   but backend `LeadCreate` does not define them.
6. **Response error parsing:** global backend errors use an envelope while the
   frontend only extracts top-level `error`/`detail`; verify useful messages survive
   every handler shape.

## Recommended automation order

1. Add pytest, pytest-asyncio, HTTPX ASGI tests, a disposable PostgreSQL database,
   and factories for users/teams/members/leads.
2. Implement P0 auth, tenant-isolation, RBAC, billing-webhook, and upload-security
   tests.
3. Generate backend OpenAPI and add frontend/backend contract checks for all API
   client methods, starting with the six blockers above.
4. Add service tests with mocked Grok, Gmail, Cal.com, Stripe, S3, Pinecone, Redis,
   Resend, and Apollo responses.
5. Add Vitest/React Testing Library for reducers, thunks, forms, and error states.
6. Add Playwright smoke tests for register→verify→login→team→onboarding→lead→email,
   meeting, proposal, knowledge upload, chat, settings, and billing.
