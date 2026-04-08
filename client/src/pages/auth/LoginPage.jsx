import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation } from "@/features/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { getRoleNames, isAdminRole } from "@/lib/roleUtils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const getRedirectPath = (user) => {
  const roles = getRoleNames(user);
  if (isAdminRole(roles)) {
    return "/admin";
  }
  return "/dashboard";
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const response = await login(data).unwrap();
      if (response?.success) {
        navigate(getRedirectPath(response?.data), { replace: true });
      }
    } catch (_) {
      // handled by UI error state
    }
  };

  const handleDemoLogin = (email, password) => {
    form.setValue("email", email);
    form.setValue("password", password);
    setTimeout(() => {
      form.handleSubmit(onSubmit)();
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Access your ShareBit dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" {...form.register("email")} placeholder="admin@sharebit.com" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <Input type="password" {...form.register("password")} placeholder="Admin@12345" />
            </div>
            {error && (
              <p className="text-sm text-red-500">
                {error?.data?.message || "Login failed"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              Sign in
            </Button>

            {/* Demo Login Section */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center font-semibold">Quick Demo Login</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("admin@sharebit.com", "Admin@12345")}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Admin Login
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("user@sharebit.com", "User@12345")}
                  disabled={isLoading}
                  className="text-xs"
                >
                  User Login
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              No account? <Link to="/register" className="text-primary">Create one</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
