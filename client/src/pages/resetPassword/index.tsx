import { useState, useEffect } from "react";
import { FaBuilding } from "react-icons/fa";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Link, useNavigate, useSearchParams } from "react-router";
import { resetPasswordSchema } from "./validation";
import { axiosInstance } from "../../config/axios";
import { API_ENDPOINTS } from "../../constants";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../utils/toast";
import type { FormikHelpers } from "formik";

interface ResetFormValues {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Reset token is missing from the URL. Please request a new link.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (
    values: ResetFormValues,
    { resetForm }: FormikHelpers<ResetFormValues>,
  ) => {
    if (!token) {
      toast.error("Cannot reset password without a valid token.");
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, {
        token,
        password: values.password,
      });

      toast.success(response.data?.message || "Password reset successful!");
      resetForm();

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || "Failed to reset password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-5">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-[var(--text-primary)] font-sans text-5xl font-bold">
          Book My Venue
        </h1>

        <div className="bg-[var(--bg-secondary)] p-2 rounded-sm">
          <FaBuilding className="text-5xl" color="white" />
        </div>
      </div>

      <div className="flex flex-col justify-center items-center">
        {!token && (
          <div className="w-120 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-500 text-sm text-center">
            Reset token is missing. Please request a new password reset link.
          </div>
        )}
        <h2 className="text-3xl text-[var(--text-primary)] mt-10 font-semibold">
          Reset Password
        </h2>

        <p className="text-[var(--text-secondary)] mt-2">
          Create a new secure password for your account.
        </p>

        <Formik
          initialValues={{
            password: "",
            confirmPassword: "",
          }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleSubmit}
        >
          <Form className="flex flex-col gap-5 w-full mt-6">

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-secondary)] text-sm" htmlFor="password">
                New Password
              </label>

              <Field
                type="password"
                id="password"
                name="password"
                placeholder="Enter new password"
                className="w-120 p-3 border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                disabled={loading || !token}
              />

              <div className="h-2">
                <ErrorMessage name="password" component="p" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-secondary)] text-sm" htmlFor="confirmPassword">
                Confirm Password
              </label>

              <Field
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                className="w-120 p-3 border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                disabled={loading || !token}
              />

              <div className="h-2">
                <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-sm" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-120 mt-6 bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border-2 hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all duration-200 p-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

          </Form>
        </Formik>

        <div className="mt-10">
          <p className="text-[var(--text-secondary)]">
            Back to
            <Link to="/login" className="text-[var(--text-primary)] ml-2 font-medium hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;