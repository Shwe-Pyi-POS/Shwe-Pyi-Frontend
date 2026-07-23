import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { removeAuthToken } from "../services/axios";
import { validateSession } from "../services/Auth/validateSession";
import {
  clearSessionValidation,
  isSessionValidated,
  markSessionValidated,
} from "../utils/authSession";

/**
 * Wraps all authenticated routes once (use with <Route element={<ProtectedRoute />}>).
 * Validates the token at most once per browser tab session (30 min TTL).
 */
export const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("authToken");
  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const runValidation = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      if (isSessionValidated(token)) {
        setIsValid(true);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      try {
        await validateSession();
        markSessionValidated(token);
        setIsValid(true);
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401 || status === 403) {
          handleLogout();
        } else {
          // Network issues or rate limit — keep user signed in if token exists
          setIsValid(true);
        }
      } finally {
        setIsValidating(false);
      }
    };

    runValidation();
  }, [token]);

  const handleLogout = () => {
    removeAuthToken();
    clearSessionValidation();
    localStorage.removeItem("adminData");
    toast.error("Session expired. Please login again.");
    setIsValid(false);
    navigate("/login", { replace: true });
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
