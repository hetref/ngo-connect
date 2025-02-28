"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function NGOMembersPage() {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    access: "level1",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [ngoData, setNgoData] = useState({});
  const [ngoId, setNgoId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkAccess(currentUser.uid);
      } else {
        // No user is signed in, redirect to login
        router.replace("/login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check if user has access to this page
  const checkAccess = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        router.replace("/login");
        return;
      }

      const userData = userDoc.data();

      // If user is level1 member, redirect them
      if (
        userData.type === "ngo" &&
        userData.role === "member" &&
        userData.accessLevel === "level1"
      ) {
        router.replace("/dashboard/ngo");
        return;
      }

      // User has access, set ngoId and continue loading
      const orgId = userData.ngoId;
      setNgoId(orgId);

      if (orgId) {
        fetchNgoData(orgId);
        subscribeToMembers(orgId);
      }

      // Access is granted, allow the component to render
      setAccessGranted(true);
      setInitialized(true);
      setLoading(false);
    } catch (error) {
      console.error("Error checking access:", error);
      router.replace("/login");
    }
  };

  // Fetch organization data
  const fetchNgoData = async (orgId) => {
    try {
      const orgDoc = await getDoc(doc(db, "ngo", orgId));
      if (orgDoc.exists()) {
        setNgoData(orgDoc.data());
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  };

  // Real-time members subscription
  const subscribeToMembers = (orgId) => {
    const membersRef = collection(db, "ngo", orgId, "members");
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersList);
    });

    return unsubscribe;
  };

  useEffect(() => {
    if (!ngoId) return;

    const unsubscribe = subscribeToMembers(ngoId);
    return () => unsubscribe();
  }, [ngoId]);

  // Check if email already exists in members collection
  const checkEmailExists = async (email) => {
    if (!email || email.trim() === "") return false;

    // First check in current members array (for performance)
    const emailExists = members.some(
      (member) =>
        member.email && member.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) return true;

    // Double-check in database (in case of recent additions)
    try {
      const membersRef = collection(db, "ngo", ngoId, "members");
      const q = query(membersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  // Check if phone already exists in members collection
  const checkPhoneExists = async (phone) => {
    if (!phone || phone.trim() === "") return false;

    // First check in current members array (for performance)
    const phoneExists = members.some(
      (member) => member.phone && member.phone === phone
    );

    if (phoneExists) return true;

    // Double-check in database (in case of recent additions)
    try {
      const membersRef = collection(db, "ngo", ngoId, "members");
      const q = query(membersRef, where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  // Check if user already exists in the users collection with the given email
  const checkExistingUser = async (email) => {
    if (!email || email.trim() === "") return null;

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("type", "==", "user")
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Return the user document data and ID
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error checking existing user:", error);
      return null;
    }
  };

  const addMember = async () => {
    if (
      !newMember.name ||
      !newMember.phone ||
      !newMember.access ||
      !newMember.email
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!ngoId) {
      toast.error("NGO ID not found");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate email
      if (newMember.email) {
        const emailExists = await checkEmailExists(newMember.email);
        if (emailExists) {
          toast.error("A member with this email already exists");
          setIsSubmitting(false);
          return;
        }
      }

      // Check for duplicate phone
      const phoneExists = await checkPhoneExists(newMember.phone);
      if (phoneExists) {
        toast.error("A member with this phone number already exists");
        setIsSubmitting(false);
        return;
      }

      // Generate a unique ID for this member
      const memberId = uuidv4();

      // Check if user already exists
      const existingUser = await checkExistingUser(newMember.email);
      const isExistingUser = !!existingUser;

      // Add member to the NGO collection
      const memberRef = doc(db, "ngo", ngoId, "members", memberId);
      await setDoc(memberRef, {
        id: memberId,
        name: newMember.name,
        email: newMember.email || null,
        phone: newMember.phone,
        accessLevel: newMember.access,
        createdAt: new Date().toISOString(),
        role: "member",
        status: "pending",
        verificationCode: memberId,
        userId: isExistingUser ? existingUser.id : null, // Store user ID if they already exist
      });

      const longLink = `${window.location.origin}/register/member/${ngoId}/${memberId}`;

      // Customize message based on whether the user already exists
      if (isExistingUser) {
        // For existing users, send a simple invitation to accept (no registration needed)
        const smsBody = `Hello ${newMember.name}, you have been added to ${ngoData.name}. Please accept the invitation: ${window.location.origin}/accept-invitation/${ngoId}/${memberId}`;

        fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: newMember.phone,
            body: smsBody,
          }),
        }).then((res) => {
          if (res.ok) {
            console.log("SMS sent successfully!");
          } else {
            console.error("Error sending SMS:", res.status);
          }
        });

        // Send email invitation (simplified for existing users)
        fetch("/api/member-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verificationCode: memberId,
            ngoId: ngoId,
            email: newMember.email,
            ngoName: ngoData.name,
            verificationLink: `${window.location.origin}/dashboard/accept-invitation/${ngoId}/${memberId}`,
            isExistingUser: true,
          }),
        }).then((res) => {
          if (res.ok) {
            console.log("Email sent successfully!");
          } else {
            console.error("Error sending email:", res.status);
          }
        });
      } else {
        // For new users, send full registration link
        const smsBody = `Hello ${newMember.name}, you have been invited to join ${ngoData.name}. Please use this link: ${longLink}`;

        fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: newMember.phone,
            body: smsBody,
          }),
        }).then((res) => {
          if (res.ok) {
            console.log("SMS sent successfully!");
          } else {
            console.error("Error sending SMS:", res.status);
          }
        });

        // Send email invitation
        fetch("/api/member-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verificationCode: memberId,
            ngoId: ngoId,
            email: newMember.email,
            ngoName: ngoData.name,
            verificationLink: longLink,
            isExistingUser: false,
          }),
        }).then((res) => {
          if (res.ok) {
            console.log("Email sent successfully!");
          } else {
            console.error("Error sending email:", res.status);
          }
        });
      }

      // Reset form
      setNewMember({ name: "", email: "", phone: "", access: "level1" });
      toast.success("Member added successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Error adding member: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteMember = async (memberId) => {
    if (!ngoId) return;

    try {
      // First, get the member document to check if it has a userId reference
      const memberDoc = await getDoc(
        doc(db, "ngo", ngoId, "members", memberId)
      );

      if (memberDoc.exists()) {
        const memberData = memberDoc.data();

        // Delete from NGO collection
        await deleteDoc(doc(db, "ngo", ngoId, "members", memberId));

        // If there's a userId, update the user document instead of deleting it
        if (memberData.userId) {
          const userRef = doc(db, "users", memberData.userId);

          // Get the current user document
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            // Update fields to convert from member to regular user
            await setDoc(
              userRef,
              {
                ...userDoc.data(),
                type: "user", // Change type back to "user"
                role: null, // Remove role
                ngoId: null, // Remove ngoId
                accessLevel: null, // Remove accessLevel
                memberId: null, // Remove memberId reference
                // Add any other fields you want to reset
              },
              { merge: true }
            );

            console.log(
              `User ${memberData.userId} converted back to regular user`
            );
          }
        } else {
          // Search for and update any user documents with matching memberId
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("memberId", "==", memberId));
          const querySnapshot = await getDocs(q);

          const updatePromises = querySnapshot.docs.map((userDoc) =>
            setDoc(
              doc(db, "users", userDoc.id),
              {
                ...userDoc.data(),
                type: "user",
                role: null,
                ngoId: null,
                accessLevel: null,
                memberId: null,
              },
              { merge: true }
            )
          );

          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(
              `Updated ${updatePromises.length} associated user document(s)`
            );
          }
        }
      }

      toast.success("Member deleted successfully!");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Error deleting member");
    }
  };
  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
  );

  // Render loading state until we've checked access
  if (loading) {
    return <div>Loading...</div>;
  }

  // Only render the component if access is granted
  if (!accessGranted) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
          <CardDescription>Add and manage organization members</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Add Member Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4">Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new member to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    Mobile No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({ ...newMember, phone: e.target.value })
                    }
                    required
                    placeholder="e.g: 903483445"
                  />
                </div>
                <div>
                  <Label>
                    Access Level <span className="text-red-500">*</span>
                  </Label>
                  <div>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300"
                      value={newMember.access}
                      onChange={(e) =>
                        setNewMember({ ...newMember, access: e.target.value })
                      }
                      required
                    >
                      <option value="level1">
                        Level 1 (Activity Management, Inventory Management)
                      </option>
                      <option value="level2">Level 2 (All Features)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addMember} disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Input
            placeholder="Search members by name, email or phone..."
            className="mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email || "-"}</TableCell>
                    <TableCell>{member.phone || "-"}</TableCell>
                    <TableCell>
                      {member.accessLevel === "level1" ? "Level 1" : "Level 2"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          member.status === "pending"
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setViewOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMember(member.id)}
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Member Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <div className="mt-1 font-medium">{selectedMember.name}</div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="mt-1">{selectedMember.email || "-"}</div>
              </div>
              <div>
                <Label>Phone</Label>
                <div className="mt-1">{selectedMember.phone || "-"}</div>
              </div>
              <div>
                <Label>Access Level</Label>
                <div className="mt-1">
                  {selectedMember.accessLevel === "level1"
                    ? "Level 1 (Activity Management, Inventory Management)"
                    : "Level 2 (All Features)"}
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      selectedMember.status === "pending"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {selectedMember.status}
                  </span>
                </div>
              </div>
              <div>
                <Label>Joined Date</Label>
                <div className="mt-1 text-sm text-gray-500">
                  {selectedMember.createdAt
                    ? new Date(selectedMember.createdAt).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div>
                <Label>Member ID</Label>
                <div className="mt-1 text-sm text-gray-500">
                  {selectedMember.id}
                </div>
              </div>
              {selectedMember.userId && (
                <div>
                  <Label>User ID</Label>
                  <div className="mt-1 text-sm text-gray-500">
                    {selectedMember.userId}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setViewOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
