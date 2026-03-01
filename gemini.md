# Humor Project - Caption Voting System

This project is a web application where users can view and interact with captions. This feature addition implements a Reddit-style upvote/downvote system for captions.

## Feature Overview: Reddit-Style Voting
- **Authentication Required**: Only logged-in users can vote.
- **Data Persistence**: Votes are stored in the `caption_votes` table.
- **Reddit UI**: Upvote arrow, score, and downvote arrow are displayed vertically to the left of each caption.
- **Visual Feedback**: Buttons change color based on the user's active vote (e.g., orange for upvote, blue for downvote).

## Changelog
### 2026-02-19
- Created `gemini.md` to track project documentation and changes.
- Created `components/vote-control.tsx` to handle Reddit-style upvoting/downvoting logic and UI.
- Redesigned the entire UI to match Reddit's aesthetic (colors, typography, voting layout).
- Renamed "Dashboard" to "Profile" and added a "Home" button for better navigation.
- Enhanced the Profile page to display a user's voting history (captions they've upvoted/downvoted).
- Removed non-functional "Comment" and "Share" buttons from the UI.
- Modified `app/page.tsx` and `components/infinite-feed.tsx` with updated Reddit-style styling.
- Created `components/infinite-feed.tsx` to handle infinite scrolling using an IntersectionObserver and client-side pagination.
- Debugged and resolved an issue with the Supabase query join for `caption_votes`.

### 2026-03-01
- **Infinite Scroll & Reliability**:
  - Improved `IntersectionObserver` threshold from 1.0 to 0.1 in `InfiniteFeed` for more responsive auto-loading.
  - Added a manual "Load More" button as a fallback for the infinite scroll.
- **Content Freshness**:
  - Implemented client-side and server-side filtering to exclude captions the user has already voted on.
  - Updated `InfiniteFeed` to maintain a local list of voted IDs that are excluded from subsequent fetches.
  - Enhanced `VoteControl` to notify parent components of voting actions via an `onVote` callback.
- **UI & Aesthetic Simplification**:
  - Renamed the application header to "Humor Social".
  - Removed "r/humor" and creator information (username/initials) from post headers.
  - Updated post timestamps to show both the date and time (e.g., "Mar 1, 10:30 AM").

### 2026-03-01 (Part 2)
- **Image Upload Pipeline**:
  - Created `lib/api-service.ts` implementing the 4-step upload and captioning pipeline (Generate Presigned URL -> Upload Bytes -> Register Image -> Generate Captions).
  - Integrated with `https://api.almostcrackd.ai` using Supabase auth tokens.
- **UI/UX Enhancements**:
  - Created a unified `Navbar` component with an "Upload Image" button.
  - Implemented `UploadModal` with real-time feedback and loading states ("Uploading image...", "Generating captions...").
  - Redesigned the User Profile (`app/protected/page.tsx`) with a tabbed interface.
  - Added "Voting History" and "Uploaded Images" tabs to the profile page.
- **Social Media Experience Pivot**:
  - Relocated the "Upload" button to the right side of the navbar, next to the Profile button.
  - Enhanced the "Uploaded Images" tab to allow clicking an image to see its generated captions.
  - Removed the "u/" and "r/" prefixes from usernames and sections for a more generic social media feel.
  - Updated the `UploadModal` to show the uploaded image alongside its captions after generation.
- **Feed Sorting & Popularity**:
  - Implemented a sorting UI in the `InfiniteFeed` component allowing users to toggle between "Newest", "Top (Day)", "Top (Week)", and "Top (Month)".
  - Updated `app/page.tsx` to handle server-side sorting via search parameters.
  - Enhanced `InfiniteFeed` to support both cursor-based (for newest) and range-based (for top) pagination.
  - Added synchronization logic in `VoteControl` to update the `like_count` field in the `captions` table via an RPC call for efficient popularity-based sorting.
- **Gesture-Based Voting & UX**:
  - Refactored `InfiniteFeed` to use a dedicated `FeedItem` component for better state management.
  - Implemented gesture-based voting: Users can now click the right side of an image to upvote or the left side to downvote.
  - Added interactive overlays on images that appear on hover, providing visual feedback with arrows and color-coded backgrounds (orange for upvote, blue for downvote).
- **UI Consistency & Image Refinement**:
  - Unified the "Voting History" tab on the profile page to use the shared `FeedItem` component, bringing gesture-based voting to the user's history.
  - Redesigned the image container to have a consistent vertical height (450px) without cropping images (`object-contain`), ensuring a steady feed rhythm.
  - Simplified the hover voting overlays by removing background circles and borders, using large, high-contrast icons with drop shadows for a cleaner, modern look.
- **Responsive Sidebar Layout**:
  - Expanded the `Navbar` to span the full width of the screen on all pages (including Profile), with content centered in a `max-w-6xl` container.
  - Standardized the "Sort Feed" interface to use dropdown menus in both the desktop sidebar and mobile headers, ensuring a consistent and familiar interaction pattern.
  - Optimized the homepage and profile layouts to use a flexible grid system, centering the main content while utilizing sidebars on larger screens where appropriate.
- **Architectural Cleanup**:
  - Unified the navigation header across Home and Profile pages to reduce duplication and improve maintainability.
