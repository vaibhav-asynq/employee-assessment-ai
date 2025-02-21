"use client";
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Download, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generatePdfDocument } from '@/lib/api';

interface EditableWordViewerProps {
  documentUrl: string;
  onContentChange?: (content: string) => void;
  analysis?: any;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-slate-200' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-slate-200' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-slate-200' : ''}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-slate-200 mx-2" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-slate-200 mx-2" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function EditableWordViewer({ documentUrl, onContentChange, analysis }: EditableWordViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onContentChange) {
        onContentChange(html);
      }
    },
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(documentUrl);
        const blob = await response.blob();
        const text = await blob.text();
        setContent(text);
        editor?.commands.setContent(text);
      } catch (error) {
        console.error('Error loading document:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [documentUrl, editor]);

  const loadPdf = async () => {
    try {
      if (!analysis) return;
      const blob = await generatePdfDocument(analysis);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  useEffect(() => {
    if (!isEditMode && !pdfUrl && analysis) {
      loadPdf();
    }
  }, [isEditMode, analysis]);

  // Load PDF by default
  useEffect(() => {
    if (analysis && !pdfUrl) {
      loadPdf();
    }
  }, [analysis]);

  // Cleanup PDF URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = 'interview_analysis.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[900px] border rounded-lg p-8 flex items-center justify-center">
        <p>Loading document...</p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              View PDF
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Mode
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      
      {isEditMode ? (
        <>
          <MenuBar editor={editor} />
          <div className="p-4 prose max-w-none">
            <EditorContent editor={editor} className="min-h-[800px] border rounded-lg p-4" />
          </div>
        </>
      ) : (
        <div className="p-4">
          {pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-[800px] border rounded-lg"
            >
              <p>PDF preview not available</p>
            </object>
          ) : (
            <div className="w-full h-[800px] border rounded-lg flex items-center justify-center">
              <p>Loading PDF preview...</p>
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        .ProseMirror {
          min-height: 800px;
          padding: 1rem;
          > * + * {
            margin-top: 0.75em;
          }
          ul, ol {
            padding: 0 1rem;
          }
          h1 {
            font-size: 2em;
          }
          h2 {
            font-size: 1.5em;
          }
          h3 {
            font-size: 1.25em;
          }
          &:focus {
            outline: none;
          }
        }
      `}</style>
    </div>
  );
}
