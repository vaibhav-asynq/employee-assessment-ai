import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import DOMPurify from "dompurify";
import { parse, HTMLElement } from "node-html-parser";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

function DocEditor({
  initialContent,
  onContentChange,
}: {
  initialContent: string;
  onContentChange: (content: string) => void;
}) {
  // Prepare the content
  const preparedContent = useMemo(() => {
    return cleanAndPrepareHTML(initialContent);
  }, [initialContent]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Underline,
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      OrderedList,
      ListItem,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
    ],
    content: preparedContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onContentChange(content);
    },
  });

  if (!editor) return null;

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
}

function DocEditorOld({
  initialContent,
  onContentChange,
}: {
  initialContent: string;
  onContentChange: (newContent: string) => void;
}) {
  console.log({ initialContent });
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = DOMPurify.sanitize(editor.getHTML());
      onContentChange?.(content);
    },
  });

  // Set link
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded">
      <div className="flex gap-2 p-2 border-b">
        {/* Formatting Buttons */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`
            p-2 rounded 
            ${editor.isActive("bold") ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
          `}
        >
          <Bold size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`
            p-2 rounded 
            ${editor.isActive("italic") ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
          `}
        >
          <Italic size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`
            p-2 rounded 
            ${editor.isActive("underline") ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
          `}
        >
          <UnderlineIcon size={16} />
        </button>

        <button
          onClick={setLink}
          className={`
            p-2 rounded 
            ${editor.isActive("link") ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
          `}
        >
          <LinkIcon size={16} />
        </button>

        <button onClick={addImage} className="p-2 rounded hover:bg-gray-100">
          <ImageIcon size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}

function extractMainContent(htmlContent: string) {
  const root = parse(htmlContent);

  // Target specific sections
  const strengthsSection = root.querySelector('span:contains("Strengths")');
  const areasToTargetSection = root.querySelector(
    'span:contains("Areas to Target")',
  );
  const nextStepsSection = root.querySelector('span:contains("Next Steps")');

  // Reconstruct the content
  const extractedContent = [
    strengthsSection?.parentNode?.parentNode?.innerHTML,
    areasToTargetSection?.parentNode?.parentNode?.innerHTML,
    nextStepsSection?.parentNode?.parentNode?.innerHTML,
  ]
    .filter(Boolean)
    .join("");

  return extractedContent;
}

// Custom HTML cleaning function
function cleanAndPrepareHTML(htmlContent: string) {
  // Remove specific Word-generated attributes and styles
  const cleanedHtml = htmlContent
    .replace(/style="[^"]*(-aw-[^"]*)?"/g, "") // Remove -aw- specific styles
    .replace(/\s*letter-spacing:\s*[^;]*;?/g, "") // Remove letter-spacing
    .replace(/<span[^>]*>\s*&#xa0;\s*<\/span>/g, "") // Remove non-breaking space spans
    .replace(/<img[^>]*>/g, "") // Remove images
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/>\s+</g, "><"); // Remove spaces between tags

  // Sanitize the HTML
  return DOMPurify.sanitize(cleanedHtml, {
    ALLOWED_TAGS: [
      "p",
      "span",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "div",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: ["style", "class"],
  });
}

interface Props {
  htmlContentRes: string;
}
export function ModifyContent({ htmlContentRes }: Props) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract and clean content
    const extractedContent = extractMainContent(htmlContentRes);
    const sanitizedHtml = DOMPurify.sanitize(extractedContent, {
      ALLOWED_TAGS: [
        "p",
        "span",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "div",
        "br",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ],
      ALLOWED_ATTR: ["style", "class"],
    });

    setHtmlContent(sanitizedHtml);
    setIsLoading(false);
  }, [htmlContentRes]);

  const handleContentChange = (newContent: string) => {
    setHtmlContent(newContent);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {htmlContent && (
        <DocEditor
          key={htmlContent} // Force re-render if content changes
          initialContent={htmlContent}
          onContentChange={handleContentChange}
        />
      )}

      {/* <div */}
      {/*   className="mt-4 p-4 border rounded" */}
      {/*   dangerouslySetInnerHTML={{ __html: htmlContent }} */}
      {/* /> */}
    </div>
  );
}

export function ModifyContentOld({ htmlContentRes }: Props) {
  const sanitizedHtml = DOMPurify.sanitize(htmlContentRes);
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    if (sanitizedHtml) {
      setHtmlContent(sanitizedHtml);
    }
  }, [sanitizedHtml]);

  console.log(htmlContent);
  const handleContentChange = (newContent: string) => {
    setHtmlContent(newContent);
    //TODO: implement backnend data saving
  };

  return (
    <div>
      <DocEditor
        initialContent={htmlContent}
        onContentChange={handleContentChange}
      />

      <div
        className="mt-4 p-4 border rounded"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
