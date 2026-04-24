import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị | XeAdmin",
  description: "Đăng nhập vào trang quản trị",
};

export default function SignIn() {
  return <SignInForm />;
}
