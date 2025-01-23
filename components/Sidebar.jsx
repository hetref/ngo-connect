"use client";

// import { auth, db } from "@/firebase";
// import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, onSnapshot } from "firebase/firestore";
// import {
//   ngoSidebarItems,
//   userSidebarItems,
//   institutionSidebarItems,
// } from "@/constants";
import toast from "react-hot-toast";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userDetail, setUserDetail] = useState();
  const [sidebarItems, setSidebarItems] = useState([]);
  const [showInfoText, setShowInfoText] = useState(false);
  const [user, setUser] = useState(null);
  const [orgDetail, setOrgDetail] = useState(null);

  // Monitor authentication state
  // useEffect(() => {
  //   const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
  //     if (currentUser) {
  //       setUser(currentUser);
  //     } else {
  //       router.push("/");
  //     }
  //   });

  //   return () => unsubscribeAuth();
  // }, [router]);

  // Fetch user details
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setUserDetail(userData);
          if (userData.type === "Ngo") {
            setSidebarItems(ngoSidebarItems);
          } else if (userData.type === "institution") {
            setSidebarItems(institutionSidebarItems);
          } else if (userData.type === "user") {
            setSidebarItems(userSidebarItems);
          }
        } else {
          console.log("User document does not exist.");
          setUserDetail(null); // Reset user details if not found
        }
      });

      return () => unsubscribeUser(); // Ensure user unsubscribe
    }
  }, [user]);

  // Fetch organization/institution details based on user type
  useEffect(() => {
    if (userDetail?.type) {
      const orgDocRef = doc(db, userDetail.type, user.uid);
      const unsubscribeOrg = onSnapshot(orgDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOrgDetail({ ...data, uid: user.uid });
          setShowInfoText(data.info); // Update based on the `info` field
        } else {
          console.log("Ngo/Institution document does not exist.");
          setOrgDetail(null);
          setShowInfoText(null);
        }
      });

      return () => unsubscribeOrg(); // Ensure organization unsubscribe
    }
  }, [userDetail?.type, user]);

  const logoutHandle = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/");
      console.log("Logged out successfully");
    } catch (error) {
      console.error(error);
    }
  };

  // if (loading) return <h1>Loading...</h1>;

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-black/80 text-white">
      <div className="px-3 py-2 flex-1">
        <Link
          href="/dashboard"
          className="flex items-center justify-center pl-3 mb-6"
        >
          <h1 className="text-2xl font-bold">Eve Manager</h1>
        </Link>
        <hr className="w-full bg-white mb-10" />
        <div className="mb-6 ml-2">
          <h4 className="text-gray-300 tracking-wide">User Status:</h4>
          <h1 className="text-xl font-bold tracking-wider">
            {userDetail?.type.charAt(0).toUpperCase() +
              userDetail?.type.slice(1)}
          </h1>
        </div>
        <div className="mb-6 ml-2">
          <h4 className="text-gray-300 tracking-wide">
            {userDetail?.type === "ngo" ? "Ngo" : "User"}:
          </h4>
          <h1 className="text-xl font-bold tracking-wider">
            {userDetail?.orgName || userDetail?.name}
          </h1>
          {orgDetail && orgDetail.info === false && (
            <h2 className="mt-2">Please fill the information.</h2>
          )}
          {orgDetail && orgDetail.plan && orgDetail.subscriptionStatus && (
            <div className="mt-4">
              <h4 className="text-gray-300 tracking-wide">Plan: </h4>
              <h1 className="text-xl font-bold tracking-wider">
                {orgDetail.subscriptionStatus === "active"
                  ? orgDetail?.plan.charAt(0).toUpperCase() +
                    orgDetail?.plan.slice(1)
                  : "Basic"}
              </h1>
              {orgDetail.subscriptionStatus === "active" && (
                <div className="mt-4">
                  <h4 className="text-gray-300 tracking-wide">Status: </h4>
                  <h1 className="text-xl font-bold tracking-wider">
                    {orgDetail?.subscriptionStatus.charAt(0).toUpperCase() +
                      orgDetail?.subscriptionStatus.slice(1)}
                  </h1>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-1">
          {sidebarItems?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition ${
                pathname === item.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              }`}
            >
              <div className="flex items-center flex-1">{item.label}</div>
            </Link>
          ))}
          <button
            onClick={logoutHandle}
            className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
          >
            <div className="flex items-center flex-1">Logout</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
