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
