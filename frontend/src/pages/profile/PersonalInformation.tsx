import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PersonalInformation() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [profilePicturePreview, setProfilePicturePreview] =
    useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "Kenya",
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    api.user
      .getUser(userId)
      .then((userData: any) => {
        setUser(userData);
        setFormData({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          dateOfBirth: userData.dateOfBirth || "",
          address: userData.address || "",
          city: userData.city || "",
          country: userData.country || "Kenya",
        });
        setProfilePicture(userData.profilePicture || "");
        setProfilePicturePreview(userData.profilePicture || "");
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  // Simple file to base64 conversion without any canvas operations
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log("File converted to base64, length:", result?.length);
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB for direct upload without compression)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB. Please choose a smaller image.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      console.log("Processing file:", file.name);
      console.log("File size:", file.size, "bytes");
      console.log("File type:", file.type);

      // Convert directly to base64 without any compression
      const base64Image = await fileToBase64(file);
      console.log("Base64 conversion successful");
      console.log("Base64 starts with:", base64Image.substring(0, 50));

      setProfilePicture(base64Image);
      setProfilePicturePreview(base64Image);

      console.log("Profile picture state updated successfully");
    } catch (error) {
      console.error("Failed to process image:", error);
      alert("Failed to process image. Please try another file.");
    }
  };

  const handleSave = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsSaving(true);
    try {
      console.log(
        "Saving profile with picture length:",
        profilePicture?.length || 0
      );
      console.log(
        "Profile picture starts with:",
        profilePicture?.substring(0, 50)
      );

      const updatedUser = (await api.user.updateProfile(userId, {
        ...formData,
        profilePicture,
      })) as any;

      console.log("Updated user received:", updatedUser);
      console.log(
        "Profile picture in response:",
        updatedUser?.profilePicture?.substring(0, 50)
      );

      // Update localStorage
      localStorage.setItem("userName", formData.name);
      localStorage.setItem("userPhone", formData.phone);

      // Update sessionStorage cache with new profile picture
      sessionStorage.setItem("cachedUserProfile", JSON.stringify(updatedUser));

      // Also update other caches that might have user data
      const cachedUser = sessionStorage.getItem("cachedUser");
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        sessionStorage.setItem(
          "cachedUser",
          JSON.stringify({
            ...userData,
            profilePicture: updatedUser.profilePicture || profilePicture,
          })
        );
      }

      alert("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <main className="container py-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Personal Information
            </h1>
            <p className="text-muted-foreground">Update your details</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {profilePicturePreview &&
                  profilePicturePreview.trim() !== "" ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover border-4 border-primary/20 bg-muted"
                      onLoad={(e) => {
                        console.log("Image loaded successfully");
                        e.currentTarget.style.opacity = "1";
                      }}
                      onError={(e) => {
                        console.error("Failed to load image preview");
                        console.error(
                          "Image src length:",
                          profilePicturePreview.length
                        );
                        e.currentTarget.style.display = "none";
                      }}
                      style={{ opacity: 0, transition: "opacity 0.3s" }}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-primary-foreground">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-center space-y-2">
                  <Label
                    htmlFor="profilePicture"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Choose Photo
                  </Label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Phone number cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name}
            className="w-full"
            size="lg">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
