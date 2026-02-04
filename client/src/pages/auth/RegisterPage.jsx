import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterMutation } from "@/features/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(6).optional().or(z.literal("")),
});

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const response = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      }).unwrap();

      if (response?.success) {
        navigate("/verify-otp?email=" + encodeURIComponent(data.email));
      }
    } catch (_) {
      // handled by UI error state
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your ShareBit account</CardTitle>
          <CardDescription>Get started with just your name, email, and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Full Name</label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone (optional)</label>
                <Input {...form.register("phone")} />
              </div>
            </div>
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
                {error?.data?.message || "Registration failed"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              Register
            </Button>
            <div className="text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary">Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
