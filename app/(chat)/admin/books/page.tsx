"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Book, FileText } from "lucide-react";
import { Book as BookType } from "@/lib/db/schema";
import { DeleteModal } from "@/components/delete-modal";

export default function BooksPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [books, setBooks] = useState<BookType[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDeleteClick = (bookId: string) => {
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <Book className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold">Knowledge Management</h1>
            </div>

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
                                    onClick={() => handleDeleteClick(book.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

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
