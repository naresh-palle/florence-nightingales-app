# Architecture Audit: Florence Nightingales Mobile Application

## Current State

The existing application located at `florence-nightingales-app` is a minimal React Native (Expo) application. Its current architecture is designed solely to wrap the existing website (`https://www.florencenightingales.in/`) inside a native mobile container.

### Frontend
- **Framework**: React Native (Expo SDK 52)
- **Navigation**: None (Single screen application)
- **Core Component**: `react-native-webview` used to render the live website.
- **State Management**: None.
- **Styling**: Minimal React Native StyleSheet; relies on injected JavaScript to modify the website's CSS (e.g., fixing the mobile menu transparency).

### Backend & Database
- **Current Backend**: None (relies entirely on the external WordPress website).
- **Database**: None.
- **Authentication**: None.
- **API**: None.

## Gap Analysis vs. New Requirements

The new requirements outline a production-ready, highly secure operational management system with complex Role-Based Access Control (RBAC), financial tracking, invoicing, and auditing.

1.  **Frontend Architecture**: The current WebView approach is insufficient for the new requirements. The application needs distinct native dashboards (Admin, Team Lead, Employee), secure local session management, and complex data entry forms for billing and task management. We will need to implement a proper native UI using React Navigation.
2.  **Backend Infrastructure**: The application currently lacks a backend. We must design and build a secure API to handle authentication, authorization, and business logic.
3.  **Database**: A robust relational database (e.g., PostgreSQL) is strictly required to enforce financial data integrity, ACID transactions for payments, and maintain append-only audit logs.
4.  **Security**: The current app has no concept of users or roles. We must implement a secure authentication layer (JWT/Sessions, Argon2id hashing) and rigorous server-side authorization checks.

## Conclusion

The existing project provides a solid React Native Expo foundation (including the correctly configured Android adaptive icon and build pipeline). However, to satisfy the new operational and financial requirements, we must transition the app from a "WebView wrapper" to a fully native client-server architecture. 

**Recommendation**: We should preserve the existing Expo project setup but replace the `App.js` WebView implementation with a proper React Navigation stack. Concurrently, we must scaffold a new backend service (e.g., Node.js + PostgreSQL) to serve as the secure data and business logic layer for the mobile app.
