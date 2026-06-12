import { useState } from "react";
import { useState } from "react";
import { FaBuilding } from "react-icons/fa";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Link } from "react-router";
import { forgotPasswordSchema } from "./validation";
import { axiosInstance } from "../../config/axios";
import { API_ENDPOINTS } from "../../constants";
import { useToast } from "../../hooks/useToast";
import type { FormikHelpers } from "formik";

const ForgotPasswordPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    values: { email: string },
    { resetForm }: FormikHelpers<{ email: string }>,
  ) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email: values.email,
      });
      toast.success(response.data?.message || "If an account exists, a reset link has been sent.");
      resetForm();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || "Failed to request reset link. Please try again.";
      toast.error(msg);
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
        <h2 className="text-3xl text-[var(--text-primary)] mt-10 font-semibold">
          Forgot Password
        </h2>

        <p className="text-[var(--text-secondary)] mt-2 text-center max-w-md">
        <p className="text-[var(--text-secondary)] mt-2 text-center max-w-md">
          Enter your email and we’ll send you a reset link.
        </p>

        {successMessage && (
          <div className="w-120 mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500 text-green-500 text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="w-120 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-500 text-sm">
            {errorMessage}
          </div>
        )}

        <Formik
          initialValues={{
            email: "",
          }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
          onSubmit={handleSubmit}
        >
          <Form className="flex flex-col gap-5 w-full mt-6">
          <Form className="flex flex-col gap-5 w-full mt-6">

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-secondary)] text-sm" htmlFor="email">
                Email
              </label>

              <Field
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                className="w-120 p-3 border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                disabled={loading}
                disabled={loading}
              />

              <div className="h-2">
                <ErrorMessage name="email" component="p" className="text-red-500 text-sm" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-120 mt-6 bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border-2 hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all duration-200 p-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              className="w-120 mt-6 bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border-2 hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all duration-200 p-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

          </Form>
        </Formik>

        <div className="mt-10">
          <p className="text-[var(--text-secondary)]">
            Remember your password?
            <Link to="/login" className="text-[var(--text-primary)] ml-2 font-medium hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;