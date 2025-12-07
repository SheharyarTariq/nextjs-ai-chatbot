"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Book, FileText, Edit, Save, X } from "lucide-react";
import { Book as BookType, Prompt as PromptType } from "@/lib/db/schema";
import { DeleteModal } from "@/components/delete-modal";

type TabType = "knowledge" | "prompts";

export default function AdminPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>("knowledge");
    
    const [books, setBooks] = useState<BookType[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [systemPrompt, setSystemPrompt] = useState<PromptType | null>(null);
    const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [promptFormData, setPromptFormData] = useState({
        name: "System Prompt",
        content: "",
        description: "",
    });

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
            return;
        }

        if (session.user.role !== "admin") {
            // router.push("/");
            // return;
        }

        fetchBooks();
        fetchSystemPrompt();
    }, [session, status, router]);

    const fetchBooks = async () => {
        try {
            const response = await fetch("/api/books");
            if (!response.ok) throw new Error("Failed to fetch books");
            const data = await response.json();
            setBooks(data);
        } catch (error) {
            console.error("Error fetching books:", error);
            toast.error("Failed to fetch books");
        }
    };

    const fetchSystemPrompt = async () => {
        setIsLoadingPrompt(true);
        try {
            const response = await fetch("/api/prompts/system");
            if (response.ok) {
                const data = await response.json();
                setSystemPrompt(data);
                setPromptFormData({
                    name: data.name,
                    content: data.content,
                    description: data.description || "",
                });
            } else if (response.status === 404) {
                // No system prompt exists yet
                setSystemPrompt(null);
            }
        } catch (error) {
            console.error("Error fetching system prompt:", error);
            toast.error("Failed to fetch system prompt");
        } finally {
            setIsLoadingPrompt(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedExtensions = ['.pdf', '.docx', '.txt'];
        const fileExtension = '.' + file.name.toLowerCase().split('.').pop();

        if (!allowedExtensions.includes(fileExtension)) {
            toast.error("Only PDF, DOCX, and TXT files are allowed");
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            toast.error("File size too big. File size should be less than 30mb");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch("/api/books/process", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                toast.success("Book uploaded and processing started");
                fetchBooks();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to process book");
            }

            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file");
            setIsUploading(false);
        }
    };

    const handleDeleteBookClick = (bookId: string) => {
        setBookToDelete(bookId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteBook = async () => {
        if (!bookToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/books?id=${bookToDelete}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Book deleted successfully");
                fetchBooks();
            } else {
                toast.error("Failed to delete book");
            }
        } catch (error) {
            console.error("Error deleting book:", error);
            toast.error("Failed to delete book");
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setBookToDelete(null);
        }
    };

    const handleEditPrompt = () => {
        setIsEditingPrompt(true);
    };

    const handleSavePrompt = async () => {
        try {
            if (!promptFormData.content) {
                toast.error("Content is required");
                return;
            }

            setIsSavingPrompt(true);
            const method = systemPrompt ? "PUT" : "POST";
            const body = systemPrompt
                ? { id: systemPrompt.id, ...promptFormData }
                : promptFormData;

            const response = await fetch("/api/prompts/system", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success(systemPrompt ? "Prompt updated" : "Prompt created");
                await fetchSystemPrompt();
                setIsEditingPrompt(false);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to save prompt");
            }
        } catch (error) {
            console.error("Error saving prompt:", error);
            toast.error("Failed to save prompt");
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingPrompt(false);
        if (systemPrompt) {
            setPromptFormData({
                name: systemPrompt.name,
                content: systemPrompt.content,
                description: systemPrompt.description || "",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            queued: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
        };

        const labels: Record<string, string> = {
            queued: "Queued",
            processing: "Processing",
            completed: "Completed",
            failed: "Failed",
        };

        return (
            <Badge className={variants[status] || variants.queued}>
                {labels[status] || labels.queued}
            </Badge>
        );
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center gap-3 mb-8">
                <Book className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold">Admin Management</h1>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("knowledge")}
                        className={`pb-3 px-2 font-medium transition-colors ${
                            activeTab === "knowledge"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Knowledge Base
                    </button>
                    <button
                        onClick={() => setActiveTab("prompts")}
                        className={`pb-3 px-2 font-medium transition-colors ${
                            activeTab === "prompts"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        System Prompt
                    </button>
                </div>
            </div>

            {/* Knowledge Base Tab */}
            {activeTab === "knowledge" && (
                <>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-black text-xl font-semibold mb-4">Upload Knowledge</h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Upload className="h-4 w-4" />
                                    {isUploading ? "Uploading..." : "Choose File"}
                                </Button>
                                <span className="text-sm text-gray-500">
                                    PDF, DOCX, and TXT files up to 30MB
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-black text-xl font-semibold">Knowledge Base</h2>
                            </div>
                        </div>

                        <div className="divide-y">
                            {books.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No books uploaded yet</p>
                                </div>
                            ) : (
                                books.map((book) => (
                                    <div key={book.id} className="p-6 flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-gray-500 font-medium text-lg">{book.name}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span>
                                                    Uploaded: {new Date(book.uploadDate).toLocaleDateString()}
                                                </span>
                                                {book.size && <span>Size: {book.size}</span>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                {getStatusBadge(book.processingStatus)}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteBookClick(book.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* System Prompt Tab */}
            {activeTab === "prompts" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-black text-xl font-semibold">System Prompt Configuration</h2>
                        {!isEditingPrompt && systemPrompt && (
                            <Button onClick={handleEditPrompt} variant="outline" className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Prompt
                            </Button>
                        )}
                    </div>

                    {isLoadingPrompt ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        </div>
                    ) : isEditingPrompt || !systemPrompt ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={promptFormData.name}
                                    onChange={(e) =>
                                        setPromptFormData({ ...promptFormData, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                                    placeholder="System Prompt"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={promptFormData.description}
                                    onChange={(e) =>
                                        setPromptFormData({
                                            ...promptFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                                    placeholder="Brief description of this prompt"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prompt Content
                                </label>
                                <textarea
                                    value={promptFormData.content}
                                    onChange={(e) =>
                                        setPromptFormData({ ...promptFormData, content: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-md font-mono text-sm text-gray-900"
                                    rows={20}
                                    placeholder="Enter the system prompt content here..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleSavePrompt} 
                                    className="cursor-pointer"
                                    disabled={isSavingPrompt}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSavingPrompt ? "Saving..." : "Save Prompt"}
                                </Button>
                                {systemPrompt && (
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="cursor-pointer"
                                        disabled={isSavingPrompt}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-1">Name</h3>
                                <p className="text-gray-900">{systemPrompt.name}</p>
                            </div>

                            {systemPrompt.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                                    <p className="text-gray-600">{systemPrompt.description}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                    <Badge className="bg-purple-100 text-purple-800">SYSTEM</Badge>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <div>
                                    Created: {new Date(systemPrompt.createdAt).toLocaleDateString()}{" "}
                                    {new Date(systemPrompt.createdAt).toLocaleTimeString()}
                                </div>
                                <div>
                                    Updated: {new Date(systemPrompt.updatedAt).toLocaleDateString()}{" "}
                                    {new Date(systemPrompt.updatedAt).toLocaleTimeString()}
                                </div>
                                <div>Version: {systemPrompt.version}</div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h3>
                                <div className="font-mono bg-gray-50 p-4 rounded border text-sm max-h-96 overflow-y-auto text-gray-900 whitespace-pre-wrap">
                                    {systemPrompt.content}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={confirmDeleteBook}
                loading={isDeleting}
                title="Delete Book"
                description="Are you sure you want to delete this book? This action cannot be undone."
            />
        </div>
    );
}
