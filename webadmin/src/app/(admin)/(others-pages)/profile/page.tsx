import AdminNameForm from "@/components/user-profile/AdminNameForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profile | XeAdmin",
  description: "Profile",
};

export default function Profile() {
  return (
    <div>
      <AdminNameForm />
    </div>
  );
}
