import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, CheckCircle2, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function KYC() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "upload" | "review" | "submitted">(
    "info"
  );
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "Kenya",
  });
  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    api.user.getUser(userId).then((userData: any) => {
      setUser(userData);
      setFormData((prev) => ({
        ...prev,
        fullName: userData.name || "",
      }));
    });
  }, [navigate]);

  const handleFileChange = (
    field: keyof typeof documents,
    file: File | null
  ) => {
    setDocuments((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      // In a real app, you'd upload documents to a storage service
      // and update the user's KYC status
      await api.user.updateProfile(userId, {
        kycStatus: "pending",
        kycData: formData,
      });
      setStep("submitted");
    } catch (error) {
      console.error("KYC submission failed:", error);
      alert("Failed to submit KYC. Please try again.");
    }
  };

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
              KYC Verification
            </h1>
            <p className="text-muted-foreground">Verify your identity</p>
          </div>
        </div>

        {step === "info" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full legal name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                    placeholder="National ID or Passport number"
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
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
              onClick={() => setStep("upload")}
              disabled={
                !formData.fullName ||
                !formData.idNumber ||
                !formData.dateOfBirth ||
                !formData.address
              }
              className="w-full"
              size="lg">
              Continue
            </Button>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Front Side</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="idFront"
                      onChange={(e) =>
                        handleFileChange("idFront", e.target.files?.[0] || null)
                      }
                    />
                    <label htmlFor="idFront" className="cursor-pointer">
                      {documents.idFront ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{documents.idFront.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload ID front
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ID Back Side</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="idBack"
                      onChange={(e) =>
                        handleFileChange("idBack", e.target.files?.[0] || null)
                      }
                    />
                    <label htmlFor="idBack" className="cursor-pointer">
                      {documents.idBack ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{documents.idBack.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload ID back
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Selfie with ID</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="selfie"
                      onChange={(e) =>
                        handleFileChange("selfie", e.target.files?.[0] || null)
                      }
                    />
                    <label htmlFor="selfie" className="cursor-pointer">
                      {documents.selfie ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{documents.selfie.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload selfie
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("info")}
                className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("review")}
                disabled={
                  !documents.idFront || !documents.idBack || !documents.selfie
                }
                className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{formData.fullName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ID Number</p>
                  <p className="font-medium">{formData.idNumber}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formData.dateOfBirth}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {formData.address}, {formData.city}, {formData.country}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      ID Front: {documents.idFront?.name}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      ID Back: {documents.idBack?.name}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Selfie: {documents.selfie?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                By submitting this application, you confirm that all information
                provided is accurate and agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Submit Application
              </Button>
            </div>
          </motion.div>
        )}

        {step === "submitted" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6">
            <Card>
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Application Submitted!
                  </h2>
                  <p className="text-muted-foreground">
                    Your KYC application has been submitted successfully. We'll
                    review your documents and notify you within 24-48 hours.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate("/profile")}
              className="w-full"
              size="lg">
              Back to Profile
            </Button>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
