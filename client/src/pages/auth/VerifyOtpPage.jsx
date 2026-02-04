import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVerifyOtpMutation, useResendOtpMutation } from "@/features/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z.object({
  otp: z.string().length(6),
});

export const VerifyOtpPage = () => {
  const [params] = useSearchParams();
  const email = useMemo(() => params.get("email") || "", [params]);
  const navigate = useNavigate();
  const [verifyOtp, { isLoading, error }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resendLoading }] = useResendOtpMutation();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const response = await verifyOtp({ email, otp: data.otp }).unwrap();
      if (response?.success) {
        navigate("/dashboard");
      }
    } catch (_) {
      // handled by UI error state
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ email }).unwrap();
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>We sent a verification code to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">OTP</label>
              <Input {...form.register("otp")} />
            </div>
            {error && (
              <p className="text-sm text-red-500">
                {error?.data?.message || "OTP verification failed"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              Verify
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendLoading}
            >
              Resend OTP
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
