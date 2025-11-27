"use client";

import { useState, ReactNode, useRef, useEffect } from "react";
import { Editor as TinyMCEEditor } from "tinymce";
import { Editor } from "@tinymce/tinymce-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NoteModalProps {
  trigger: ReactNode;
}

export function NoteModal({ trigger }: NoteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "";

  // Fetch notes when modal opens
  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notes");
      const data = await response.json();

      if (data.success) {
        setInitialContent(data.notes || "");
        if (editorRef.current) {
          editorRef.current.setContent(data.notes || "");
        }
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();

      try {
        setLoading(true);
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: content }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Notes saved successfully");
          setOpen(false);
        } else {
          toast.error(data.error || "Failed to save notes");
        }
      } catch (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[700px] max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>Note</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4 min-h-[400px] sm:min-h-[500px]">
          <Editor
            apiKey={apiKey}
            initialValue={initialContent}
            onInit={(_evt, editor) => (editorRef.current = editor)}
            init={{
              height: 400,
              menubar: false,
              mobile: {
                menubar: false,
                toolbar_mode: 'sliding',
              },
              plugins: 'lists advlist autolink link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
              toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
              advlist_bullet_styles: 'default,circle,square',
              advlist_number_styles: 'default,lower-alpha,lower-roman,upper-alpha,upper-roman',
              lists_indent_on_tab: true,
              valid_elements: '*[*]',
              extended_valid_elements: '*[*]',
              valid_children: '+body[style]',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            }}
          />
        </div>
        <AlertDialogFooter className="shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : "Save"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
