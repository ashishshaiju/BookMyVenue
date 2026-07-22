# **Implementation Plan - Code Organization Improvements**

## **Problem Statement**
The codebase has two organizational issues:
1. **Hardcoded API endpoints**: Some hooks use hardcoded URL strings instead of the centralized `API_ENDPOINTS` constants
2. **Inconsistent toast usage**: Admin uses `toast` directly from `react-hot-toast`, but client has a better pattern with `useToast()` hook that should be standardized everywhere

Additionally, API-calling hooks like `useBookingById`, `useMyBookings`, `useSessions`, and `useExploreVenues` in the client are properly placed in services (calling service functions), but should follow consistent patterns.

## **Requirements**

1. **Replace all hardcoded endpoints with API_ENDPOINTS constants** in admin hooks
2. **Create standardized toast infrastructure** (utils/toast.ts + hooks/useToast.ts) for admin
3. **Replace all direct toast imports** with `useToast()` hook in both admin and client
4. **Verify hook placement**: Ensure API hooks in hooks/ directory properly delegate to services/ functions
5. **Keep current architecture**: All API hooks stay as hooks (no conversion to plain functions)

## **Background**

**Current State:**

**Admin:**
- ✅ Most hooks use `API_ENDPOINTS` constants
- ❌ Some hooks have hardcoded URLs:
  - `useAdminUsers.ts`: `/user/${userId}/toggle-status`, `/auth/change-password`, `/user/${userId}/reset-password`, `/moderation/bans`
  - `useVenues.ts`: `/owner/${venueId}/unblock-dates`
- ❌ Pages import `toast` directly from `react-hot-toast`
- ❌ No `utils/toast.ts` or `hooks/useToast.ts`

**Client:**
- ✅ Has `utils/toast.ts` with styled toast functions
- ✅ Has `hooks/useToast.ts` wrapper
- ✅ Hooks like `useBookingById`, `useMyBookings` properly delegate to service functions
- ❓ Need to verify if toast is used consistently via `useToast()`

## **Proposed Solution**

### **Task Breakdown**

### **Task 1: Add missing endpoints to admin constants**
- **Objective**: Ensure all API endpoints used in admin are defined in `constants/index.tsx`
- **Implementation**:
  - Open `admin/src/constants/index.tsx`
  - Add missing endpoints:
    ```typescript
    TOGGLE_USER_STATUS: "/user", // base, will append /${userId}/toggle-status
    CHANGE_PASSWORD: "/auth/change-password",
    RESET_PASSWORD: "/user", // base, will append /${userId}/reset-password
    MODERATION_BANS: "/moderation/bans", // Already exists
    OWNER_UNBLOCK_DATES: "/owner", // base, will append /${venueId}/unblock-dates
    ```
  - Verify all existing endpoints are properly named and complete
- **Tests**: Verify constants export correctly
- **Demo**: Import API_ENDPOINTS and confirm new constants are available

### **Task 2: Replace hardcoded URLs in useAdminUsers.ts with API_ENDPOINTS**
- **Objective**: Remove all hardcoded endpoint strings from admin user hooks
- **Implementation**:
  - Update `useToggleUserStatus()`: 
    - Replace `url: /user/${vars.userId}/toggle-status` 
    - With `url: ${API_ENDPOINTS.TOGGLE_USER_STATUS}/${vars.userId}/toggle-status`
  - Update `useChangePassword()`:
    - Replace `url: /auth/change-password`
    - With `url: API_ENDPOINTS.CHANGE_PASSWORD`
  - Update `useResetPassword()`:
    - Replace `url: /user/${vars.userId}/reset-password`
    - With `url: ${API_ENDPOINTS.RESET_PASSWORD}/${vars.userId}/reset-password`
  - Update `useBanUser()`:
    - Replace `url: '/moderation/bans'`
    - With `url: API_ENDPOINTS.MODERATION_BANS`
- **Tests**: Test all user management operations still work
- **Demo**: Toggle user status, change password, reset password, ban user - verify all API calls use correct endpoints

### **Task 3: Replace hardcoded URL in useVenues.ts with API_ENDPOINTS**
- **Objective**: Remove hardcoded endpoint from venue calendar hooks
- **Implementation**:
  - Update `useUnblockDates()`:
    - Replace `url: /owner/${vars.venueId}/unblock-dates`
    - With `url: ${API_ENDPOINTS.OWNER_UNBLOCK_DATES}/${vars.venueId}/unblock-dates`
  - Verify `useBlockDates()` already uses `API_ENDPOINTS.OWNER_BLOCK_DATES`
- **Tests**: Test date blocking/unblocking functionality
- **Demo**: Block and unblock dates on calendar, verify API calls work correctly

### **Task 4: Create admin utils/toast.ts with styled toast functions**
- **Objective**: Create standardized toast utility for admin matching client pattern
- **Implementation**:
  - Create `admin/src/utils/toast.ts`
  - Copy implementation from `client/src/utils/toast.ts`
  - Adjust styling if admin needs different theme colors
  - Export `showSuccess`, `showError`, `showInfo`, `extractErrorMessage`
  - Maintain same API signatures for consistency
- **Tests**: Test each toast function displays with correct styling
- **Demo**: Call showSuccess(), showError(), showInfo() and verify styled toasts appear

### **Task 5: Create admin hooks/useToast.ts wrapper hook**
- **Objective**: Create useToast hook for admin matching client pattern
- **Implementation**:
  - Create `admin/src/hooks/useToast.ts`
  - Import toast functions from `utils/toast`
  - Export hook that returns `{ success, error, info }` object
  - Exact implementation:
    ```typescript
    import { showSuccess, showError, showInfo } from '../utils/toast';
    
    export function useToast() {
      return { success: showSuccess, error: showError, info: showInfo };
    }
    ```
- **Tests**: Test hook can be called from components
- **Demo**: Use `const { success, error } = useToast()` in a test component

### **Task 6: Update admin pages to use useToast() instead of direct toast imports**
- **Objective**: Replace all `import toast from 'react-hot-toast'` with `useToast()` hook in admin
- **Implementation**:
  - Find all admin page files importing toast directly (VenuesPage.tsx, UsersPage.tsx, etc.)
  - Replace:
    ```typescript
    // OLD:
    import toast from 'react-hot-toast';
    // ...
    toast.success("Message");
    toast.error("Message");
    
    // NEW:
    import { useToast } from '../../hooks/useToast';
    // ...
    const { success, error } = useToast();
    // ...
    success("Message");
    error("Message");
    ```
  - Update all toast calls: `toast.success()` → `success()`, `toast.error()` → `error()`
  - Files to update: VenuesPage.tsx, UsersPage.tsx, OwnersPage.tsx, TeamPage.tsx, CalendarPage.tsx, ReviewsPage.tsx, OwnerBookingsPage.tsx
- **Tests**: Verify all toasts still appear correctly with styled notifications
- **Demo**: Perform actions that trigger success/error toasts across all admin pages

### **Task 7: Audit and update client to use useToast() consistently**
- **Objective**: Ensure client also uses useToast() hook everywhere instead of direct imports
- **Implementation**:
  - Search client codebase for direct toast imports: `import toast from 'react-hot-toast'`
  - Search for direct util imports: `import { showSuccess, showError } from '../utils/toast'`
  - Replace with `useToast()` hook pattern
  - Update all usage sites to destructure and use hook methods
  - Verify components don't import toast utils directly
- **Tests**: Test toast notifications across client app
- **Demo**: Navigate through client features and verify all success/error messages display correctly

### **Task 8: Verify admin hooks in hooks/ directory are properly structured**
- **Objective**: Ensure only true React hooks remain in hooks/ directory
- **Implementation**:
  - Review `admin/src/hooks/` directory contents:
    - ✅ `useApi.ts` - Generic React Query wrapper (KEEP)
    - ✅ `useModal.ts` - Modal state management (KEEP)  
    - ❌ `useAdmin.ts` - Legacy duplicate hooks (ALREADY FLAGGED FOR DELETION)
  - Confirm all hooks are proper React hooks (use useState, useQuery, useMutation, etc.)
  - Document that `useAdmin.ts` should be deleted (already in previous plan)
- **Tests**: Verify remaining hooks are used correctly
- **Demo**: Confirm useApi and useModal work as expected

### **Task 9: Verify client hooks delegate to services properly**
- **Objective**: Ensure client hooks follow best practices (thin wrappers around service functions)
- **Implementation**:
  - Review client hooks that make API calls:
    - ✅ `useBookingById` - Calls `getBookingById()` from bookingService (GOOD)
    - ✅ `useMyBookings` - Calls `getMyBookings()` from bookingService (GOOD)
    - ✅ `useSessions` - Calls `getSessions()` from authService (GOOD)
    - ✅ `useExploreVenues` - Calls `getPublicVenues()` from venueService (GOOD)
  - Verify these hooks are thin React Query wrappers (just queryKey + queryFn)
  - Check that business logic lives in service functions, not hooks
  - Document this as the correct pattern
- **Tests**: Verify all hooks work correctly
- **Demo**: Use each hook and confirm data fetching works as expected