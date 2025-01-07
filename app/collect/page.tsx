"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  Upload,
  Loader,
  Calendar,
  Weight,
  Search,
  CheckCircle,
  Trash2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import saveCollectionWaste, {
  getUserByEmail,
  getWasteCollectionTask,
  saveReward,
  updateTaskStatus,
} from "@/utils/db/actions";

const geminiApiKey = process.env.GEMINI_API_KEY;

type CollectionTask = {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  date: string;
  collectorId: number | null;
};

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoverWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserAndTask = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            toast.error("User not found. Please log in again");
          }
        } else {
          toast.error("User not logged in. Please log in");
        }
        const fetchTasks = await getWasteCollectionTask();
        setTasks(fetchTasks as CollectionTask[]);
      } catch (error) {
        console.error("Error fetching user and tasks", error);
        toast.error("Failed to load user data and tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndTask();
  }, []);

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(
    null
  );
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<{
    wasteTypeMatch: boolean;
    quantityMatch: boolean;
    confidence: number;
  } | null>(null);

  const [reward, setReward] = useState<number | null>(null);

  const handleStatusChange = async (
    taskId: number,
    newStatus: CollectionTask["status"]
  ) => {
    if (!user) {
      toast.error("Please log in to collect the waste");
      return;
    }
    try {
      //update status on db
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id);
      //update status in state
      if (updatedTask) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, collectorId: user.id }
              : task
          )
        );
        toast.success("Task status updated successfully");
      } else {
        toast.error("Failed to update task status. Please try again");
      }
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to update task status. Please try again");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const readFileAsBase64 = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error("Missing required information for verification");
      return;
    }
    setVerificationStatus("verifying");
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const base64Data = readFileAsBase64(verificationImage);
      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ];
      const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
      1. Confirm if the waste type matches: ${selectedTask.wasteType}
      2. Estimate if the quantity matches ${selectedTask.amount}
      3. Your confidence level in this assessment (as a percentage)
      Response in JSON format like this: 
      {
      "wasteTypeMatch": true/false,
      "quantityMatch": true/false,
      "confidence": confidence level as a number between 0 and 1
      }`;
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      const sanitizedText = text.replace(/```json|```/g, "").trim();
      try {
        const parseResult = JSON.parse(sanitizedText);
        setVerificationResult({
          wasteTypeMatch: parseResult.wasteTypeMatch,
          quantityMatch: parseResult.quantityMatch,
          confidence: parseResult.confidence,
        });
        setVerificationStatus("success");
        if (
          parseResult.wasteTypeMatch &&
          parseResult.quantityMatch &&
          parseResult.confidence > 0.7
        ) {
          await handleStatusChange(selectedTask.id, "verified");
          const earnedRewards = Math.floor(Math.random() * 50) + 10;
          await saveReward(user.id, earnedRewards);
          await saveCollectionWaste(selectedTask.id, user.id);
          setReward(earnedRewards);
          toast.success(
            `Verification successful! You earned ${earnedRewards} tokens!`,
            {
              duration: 5000,
              position: "top-center",
            }
          );
        } else {
          toast.error(
            "Verification failed. The collected waste does not match the reported waste"
          );
        }
      } catch (error) {
        console.error("Failed to parse JSON response", text);
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.error("Error verifying waste", error);
      setVerificationStatus("failure");
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white py-4 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Swachh Bharat Waste Collection</h1>
        </div>
      </header>
      <main className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search by area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline" size="icon" className="ml-2">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-green-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-green-600" />
                      {task.location}
                    </h2>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Trash2 className="w-4 h-4 mr-2 text-green-600" />
                      <span
                        onMouseEnter={() => setHoverWasteType(task.wasteType)}
                        onMouseLeave={() => setHoverWasteType(null)}
                        className="cursor-pointer relative"
                      >
                        {task.wasteType.length > 12
                          ? `${task.wasteType.slice(0, 12)}...`
                          : task.wasteType}
                        {hoveredWasteType === task.wasteType && (
                          <span className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                            {task.wasteType}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Weight className="w-4 h-4 mr-2 text-green-600" />
                      {task.amount}
                    </div>
                    <div className="flex items-center col-span-2">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      {task.date}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {task.status === "pending" && (
                      <Button
                        onClick={() =>
                          handleStatusChange(task.id, "in_progress")
                        }
                        variant="outline"
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Start Collection
                      </Button>
                    )}
                    {task.status === "in_progress" &&
                      task.collectorId === user?.id && (
                        <Button
                          onClick={() => setSelectedTask(task)}
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Complete & Verify
                        </Button>
                      )}
                    {task.status === "in_progress" &&
                      task.collectorId !== user?.id && (
                        <span className="text-yellow-600 text-sm font-medium">
                          In progress by another collector
                        </span>
                      )}
                    {task.status === "verified" && (
                      <span className="text-green-600 text-sm font-medium">
                        Reward Earned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="mr-2"
              >
                Previous
              </Button>
              <span className="mx-2 self-center">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pageCount))
                }
                disabled={currentPage === pageCount}
                className="ml-2"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold mb-4 text-green-600">
                Verify Collection
              </h3>
              <p className="mb-4 text-gray-600">
                Upload a photo of the collected waste to verify and earn your
                reward.
              </p>
              <div className="mb-4">
                <label
                  htmlFor="verification-image"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="verification-image"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="verification-image"
                          name="verification-image"
                          type="file"
                          className="sr-only"
                          onChange={handleImageUpload}
                          accept="image/*"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              {verificationImage && (
                <img
                  src={verificationImage}
                  alt="Verification"
                  className="mb-4 rounded-md w-full"
                />
              )}
              <Button
                onClick={handleVerify}
                className="w-full bg-green-600 text-white hover:bg-green-700"
                disabled={
                  !verificationImage || verificationStatus === "verifying"
                }
              >
                {verificationStatus === "verifying" ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Verifying...
                  </>
                ) : (
                  "Verify Collection"
                )}
              </Button>
              {verificationStatus === "success" && verificationResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p>
                    Waste Type Match:{" "}
                    {verificationResult.wasteTypeMatch ? "Yes" : "No"}
                  </p>
                  <p>
                    Quantity Match:{" "}
                    {verificationResult.quantityMatch ? "Yes" : "No"}
                  </p>
                  <p>
                    Confidence:{" "}
                    {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>
                </div>
              )}
              {verificationStatus === "failure" && (
                <p className="mt-2 text-red-600 text-center text-sm">
                  Verification failed. Please try again.
                </p>
              )}
              <Button
                onClick={() => setSelectedTask(null)}
                variant="outline"
                className="w-full mt-2"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-green-600 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>
            &copy; 2023 Swachh Bharat Waste Collection. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: CollectionTask["status"] }) {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    in_progress: { color: "bg-blue-100 text-blue-800", icon: Trash2 },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    verified: { color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  };

  const { color, icon: Icon } = statusConfig[status];

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {status.replace("_", " ")}
    </span>
  );
}
