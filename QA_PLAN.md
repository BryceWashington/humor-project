# Humor Project - QA & End-to-End Testing Plan

## Overview
This document outlines the testing strategy for the Humor Project application. The application is conceptualized as a "tree", where each logical pathway through the user interface represents a branch. 

## Application Tree (Logical Pathways)

1. **Authentication Branch**
   - **Path A:** Anonymous User -> Clicks Login -> Authenticated State.
   - **Path B:** Authenticated User -> Clicks Profile -> Clicks Sign Out -> Anonymous State.

2. **Navigation Branch**
   - **Path A:** User clicks the logo/Home button -> Navigates to `/`.
   - **Path B:** Authenticated User clicks Profile -> Navigates to `/protected`.
   - **Path C:** User clicks Upload Image -> Opens Upload Modal.

3. **Home/Feed Branch (`/`)**
   - **Path A:** Load main page -> Initial feed items display.
   - **Path B:** Scroll down -> Triggers "Load More" / Infinite Scroll -> Appends more items.
   - **Path C:** Voted filtering -> Feed should automatically exclude items the user has voted on.
   - **Path D (Voting):** Hover over item -> Vote overlay appears.
   - **Path E (Upvote):** Click right side / upvote button -> Vote is recorded (optimistic UI update).
   - **Path F (Downvote):** Click left side / downvote button -> Vote is recorded.

4. **Upload Image Branch (Modal)**
   - **Path A:** Open modal -> Select image -> Validates format/size.
   - **Path B:** Upload Flow -> Shows uploading state -> Shows generating captions state -> Displays result.
   - **Path C:** Close modal via X or backdrop click.

5. **Profile Branch (`/protected`)**
   - **Path A:** View Profile -> Shows "Voting History" and "Uploaded Images" tabs.
   - **Path B:** Switch to "Voting History" -> Displays previously voted items with the gesture-voting UI active.
   - **Path C:** Switch to "Uploaded Images" -> Displays user's uploaded images.
   - **Path D:** Click an uploaded image -> Shows generated captions.

## Testing Strategy (Playwright E2E)

We will use Playwright to simulate user interactions across these branches. Since this is an application interacting with Supabase and external APIs (`api.almostcrackd.ai`), we will employ mocked network responses in Playwright for stable and predictable E2E tests.

### Test Suites:
1. `navigation.spec.ts`: Tests routing and navbar state.
2. `feed.spec.ts`: Tests feed loading, infinite scroll, and voting interactions.
3. `upload.spec.ts`: Tests the file upload modal and mock generation process.
4. `profile.spec.ts`: Tests profile tabs and display of historical data.
5. `auth.spec.ts`: Tests login/logout UI flows.

## Bug Tracking & Resolutions
*Any bugs discovered during the execution of these test scripts will be documented here.*

### Documented Bugs:
1. **SSR Auth Desync**: Server Components were unaware of client-side Playwright mocks, causing redirects to Home even when "logged in" in the test.
   - **Fix**: Implemented `window.__TEST_SESSION__` bypass in components and handled `TESTING=true` environment variable in server-side logic for the feed.
2. **Upload Pipeline Mock Mismatch**: Test mocks used `**/image/register` while the actual service used `**/pipeline/upload-image-from-url`.
   - **Fix**: Updated Playwright routes to match `api-service.ts` precisely.
3. **Session Token Missing in Modal**: `UploadModal` relied on `supabase.auth.getSession()` which bypassed the `__TEST_SESSION__` mock.
   - **Fix**: Updated `UploadModal` to prioritize `window.__TEST_SESSION__` for authentication tokens during tests.
4. **Hydration Race Conditions**: Modal was sometimes clicked before it was fully interactive in the DOM.
   - **Fix**: Added explicit waits for locator visibility and stability before interactions.

