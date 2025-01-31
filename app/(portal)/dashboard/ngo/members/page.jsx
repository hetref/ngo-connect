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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
export default function NGOMembersPage() {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [ngoData, setNgoData] = useState({});

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchNgoData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch organization data
  const fetchNgoData = async (uid) => {
    try {
      const orgDoc = await getDoc(doc(db, "ngo", uid));
      if (orgDoc.exists()) {
        setNgoData(orgDoc.data());
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  };

  // Real-time members subscription
  useEffect(() => {
    if (!user) return;

    const membersRef = collection(db, "ngo", user.uid, "members");
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersList);
    });

    return () => unsubscribe();
  }, [user]);

  const addMember = async () => {
    if (!newMember.name || !newMember.email) return;
    const vCode = uuidv4();
    try {
      const memberRef = doc(db, "ngo", user.uid, "members", newMember.email);
      await setDoc(memberRef, {
        name: newMember.name,
        email: newMember.email,
        createdAt: new Date().toISOString(),
        role: "member",
        status: "pending",
        verificationCode: vCode,
      });
      fetch("/api/member-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationCode: vCode,
          ngoId: user.uid,
          email: newMember.email,
          ngoName: ngoData.name,
          verificationLink: `${window.location.origin}/register/member/${user.uid}/${vCode}`,
        }),
      }).then((res) => {
        if (res.ok) {
          console.log("Email sent successfully!");
        } else {
          console.error("Error sending email:", res.status);
        }
      });
      setNewMember({ name: "", email: "" });
      toast.success("Member added successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const deleteMember = async (email) => {
    try {
      await deleteDoc(doc(db, "ngo", user.uid, "members", email));
      toast.success("Member deleted successfully!");
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
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
                  <Label>Full Name</Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
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
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addMember}>Add Member</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Input
            placeholder="Search members..."
            className="mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMember(member.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                <div className="mt-1">{selectedMember.name}</div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="mt-1">{selectedMember.email}</div>
              </div>
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
