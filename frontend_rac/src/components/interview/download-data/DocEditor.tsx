import React, { useState, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { parse, HTMLElement } from "node-html-parser";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";

// Custom CSS for consistent styling
const customCSS = `
  .editor-container {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
  }
  .toolbar button {
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: #f0f0f0;
    transition: background-color 0.3s ease;
  }
  .toolbar button.active {
    background-color: #007bff;
    color: white;
  }
  .editor-content {
    border: 1px solid #ddd;
    padding: 1rem;
    min-height: 200px;
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
  }
`;

/**
 * Toolbar Component for Tiptap Editor
 */
const Toolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="toolbar flex flex-wrap gap-2 mb-4">
      {/* Basic Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`toolbar-button ${editor.isActive("bold") ? "active" : ""}`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`toolbar-button ${editor.isActive("italic") ? "active" : ""}`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`toolbar-button ${editor.isActive("underline") ? "active" : ""}`}
      >
        Underline
      </button>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-button ${editor.isActive("bulletList") ? "active" : ""}`}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-button ${editor.isActive("orderedList") ? "active" : ""}`}
      >
        Numbered List
      </button>

      {/* Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`toolbar-button ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
      >
        Align Left
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`toolbar-button ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
      >
        Align Center
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`toolbar-button ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
      >
        Align Right
      </button>
    </div>
  );
};

/**
 * Cleans and sanitizes HTML content for safe rendering
 */
function cleanAndPrepareHTML(htmlContent: string): string {
  try {
    // Remove unnecessary attributes and styles
    const cleanedHtml = htmlContent
      .replace(/style="[^"]*(-aw-[^"]*)?"/g, "") // Remove Aspose-specific styles
      .replace(/\s*letter-spacing:\s*[^;]*;?/g, "") // Remove letter-spacing
      .replace(/<span[^>]*>\s*&#xa0;\s*<\/span>/g, "") // Remove empty spans
      .replace(/<img[^>]*>/g, "") // Remove images
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/>\s+</g, "><"); // Normalize tags

    // Sanitize the HTML
    const sanitizedHtml = DOMPurify.sanitize(cleanedHtml, {
      ALLOWED_TAGS: ["p", "span", "strong", "em", "u", "ol", "ul", "li", "br"],
      ALLOWED_ATTR: ["style"],
    });

    return sanitizedHtml;
  } catch (error) {
    console.error("Error cleaning HTML:", error);
    return "";
  }
}

/**
 * Tiptap Editor Component
 */
const DocEditor = ({ initialContent, onContentChange }) => {
  const preparedContent = useMemo(
    () => cleanAndPrepareHTML(initialContent),
    [initialContent],
  );

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          style:
            'font-family: "Times New Roman", Times, serif; font-size: 12pt;',
        },
      }),
      Text,
      Bold,
      Italic,
      Underline,
      OrderedList,
      // BulletList,
      ListItem,
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
    ],
    content: preparedContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onContentChange(content);
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="editor-container">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

/**
 * Main Content Modification Component
 */
export function ModifyContent({ htmlContentRes }: { htmlContentRes: string }) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sanitizedHtml = cleanAndPrepareHTML(htmlContentRes);
      if (!sanitizedHtml) {
        setError("Failed to process HTML content");
        return;
      }
      setHtmlContent(sanitizedHtml);
      setError(null);
    } catch (err) {
      console.error("Error processing HTML:", err);
      setError("An error occurred while processing the HTML");
    }
  }, [htmlContentRes]);

  const handleContentChange = (newContent: string) => {
    setHtmlContent(newContent);
    // TODO: Implement backend saving logic here
  };

  const downloadAsWord = () => {
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.doc";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async () => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (error) {
    return <div className="text-red-500 p-4 border rounded">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <style>{customCSS}</style>

      {/* Editor */}
      <DocEditor
        initialContent={htmlContent}
        onContentChange={handleContentChange}
      />

      {/* Preview */}
      {/* <div */}
      {/*   className="preview-container p-4 border rounded bg-gray-50" */}
      {/*   dangerouslySetInnerHTML={{ __html: htmlContent }} */}
      {/* /> */}

      {/* Download Buttons */}
      <div className="flex gap-4">
        <button
          onClick={downloadAsWord}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Download as Word
        </button>
        {/* <button */}
        {/*   onClick={downloadAsPDF} */}
        {/*   className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" */}
        {/* > */}
        {/*   Download as PDF */}
        {/* </button> */}
      </div>
    </div>
  );
}

export default ModifyContent;
