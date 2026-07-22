import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "@/services/adminService";
import { axiosInstance } from "@/config/axios";
import { API_ENDPOINTS } from "@/constants";

vi.mock("@/config/axios", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("admin adminService API handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Venue Moderation API", () => {
    it("should fetch paginated venues list with query parameters", async () => {
      const mockResult = {
        venues: [{ _id: "v_1", name: "Kochi Convention Center" }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, limit: 10 },
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: { data: mockResult },
      });

      const data = await adminService.getVenues(1, 10, "PendingReview");

      expect(axiosInstance.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN_VENUES}?page=1&limit=10&status=PendingReview`
      );
      expect(data).toEqual(mockResult);
    });

    it("should approve venue by ID", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "Venue approved successfully" },
      });

      const res = await adminService.approveVenue("v_123");

      expect(axiosInstance.post).toHaveBeenCalledWith(`${API_ENDPOINTS.VENUES}/v_123/approve`);
      expect(res.success).toBe(true);
    });

    it("should reject venue with reason", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "Venue rejected" },
      });

      const res = await adminService.rejectVenue("v_123", "Incomplete address documents");

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.VENUES}/v_123/reject`,
        { reason: "Incomplete address documents" }
      );
      expect(res.success).toBe(true);
    });
  });

  describe("RBAC & User Moderation API", () => {
    it("should promote user to admin role by email", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "User promoted to admin" },
      });

      const res = await adminService.promoteToAdmin("newadmin@example.com");

      expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.RBAC_PROMOTE, {
        email: "newadmin@example.com",
      });
      expect(res.success).toBe(true);
    });

    it("should ban user with scope and reason", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "User banned successfully" },
      });

      const res = await adminService.banUser("user_999", "global", "Terms violation");

      expect(axiosInstance.post).toHaveBeenCalledWith(API_ENDPOINTS.MODERATION_BANS, {
        userId: "user_999",
        scope: "global",
        reason: "Terms violation",
        venueId: undefined,
        expiresAt: undefined,
      });
      expect(res.success).toBe(true);
    });

    it("should unban user by userId", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "User unbanned" },
      });

      const res = await adminService.unbanUser("user_999");

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.TOGGLE_USER_STATUS}/user_999/unban`
      );
      expect(res.success).toBe(true);
    });
  });

  describe("Review Moderation API", () => {
    it("should moderate review with action and reason", async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { success: true, message: "Review removed" },
      });

      const res = await adminService.moderateReview("rev_555", "remove", "Abusive language");

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.REVIEWS}/rev_555/moderate`,
        { action: "remove", reason: "Abusive language" }
      );
      expect(res.success).toBe(true);
    });
  });
});
