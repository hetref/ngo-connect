"use client";

import Image from "next/image";
import logo from "@/public/logo.png";
import bg from "@/public/bg.jpg";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Loading from "@/components/loading/Loading";

const AuthLayout = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  return (
    <section className="bg-white min-h-screen">
      <div className="grid lg:grid-cols-12 items-center justify-center">
        {/* Left Section */}
        <section className="relative flex items-center bg-gray-900 lg:col-span-5 xl:col-span-6 lg:h-screen">
          <Image
            alt="Background"
            src={bg}
            fill
            priority
            quality={100}
            className="absolute inset-0 object-cover w-full h-full opacity-50"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
          />
          <div className="hidden lg:flex flex-col items-start justify-center lg:p-12 text-white z-10">
            <a className="block" href="#">
              <Image
                src={logo}
                alt="logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </a>
            <h1 className="text-3xl font-serif p-4">Welcome to NGO-Connect!</h1>
            <p className="text-lg font-serif pl-4">
              where every detail is crafted to make your experience
              extraordinary
            </p>
          </div>
        </section>

        {/* Right Section */}
        <main className="flex justify-center items-center px-4 py-4 sm:px-8 lg:col-span-7 xl:col-span-6">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-lg xl:max-w-2xl">
            {/* Logo for small screens */}
            <div className="relative lg:hidden flex justify-center mb-6">
              <a href="#">
                <Image
                  src={logo}
                  alt="logo"
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              </a>
            </div>
            {/* Content */}
            <div>{children}</div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default AuthLayout;
