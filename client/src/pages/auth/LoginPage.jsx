import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation } from "@/features/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const response = await login(data).unwrap();
      if (response?.success) {
        navigate("/dashboard");
      }
    } catch (_) {
      // handled by UI error state
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Access your AssetNode portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <Input type="password" {...form.register("password")} />
            </div>
            {error && (
              <p className="text-sm text-red-500">
                {error?.data?.message || "Login failed"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              Sign in
            </Button>
            <div className="text-sm text-muted-foreground">
              No account? <Link to="/register" className="text-primary">Create one</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
