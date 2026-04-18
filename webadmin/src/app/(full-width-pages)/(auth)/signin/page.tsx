import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In | XeAdmin",
  description: "Sign in to admin dashboard",
};

export default function SignIn() {
  return <SignInForm />;
}
