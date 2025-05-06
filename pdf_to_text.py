#!/usr/bin/env python3
"""
A simple utility to convert PDF files to text using Aspose.Words.
This script is completely independent of any project and focuses solely on
PDF-to-text conversion functionality.
"""

import os
import sys
import argparse
from datetime import datetime
import aspose.words as aw


class PdfToTextConverter:
    """
    A class for converting PDF files to text using Aspose.Words.
    """
    
    def __init__(self):
        """Initialize the converter."""
        self.output_dir = "output"
        
    def ensure_output_dir(self):
        """Ensure the output directory exists."""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"Created output directory: {self.output_dir}")
    
    def convert_pdf_to_text(self, pdf_path, output_path=None):
        """
        Convert a PDF file to text using Aspose.Words.
        
        Args:
            pdf_path: Path to the PDF file
            output_path: Path to save the output text file (optional)
            
        Returns:
            Tuple of (text content, output file path)
        """
        try:
            print(f"Loading PDF: {pdf_path}")
            
            # Load PDF document using Aspose.Words
            doc = aw.Document(pdf_path)
            
            # Get total pages
            total_pages = doc.page_count
            print(f"PDF has {total_pages} pages")
            
            # Extract text from the document
            text_content = []
            
            for node in doc.get_child_nodes(aw.NodeType.PARAGRAPH, True):
                paragraph = node.as_paragraph()
                if paragraph.get_text().strip():
                    text_content.append(paragraph.get_text())
            
            # Join all paragraphs with newlines
            full_text = "\n".join(text_content)
            
            # Determine output path if not provided
            if not output_path:
                self.ensure_output_dir()
                filename = os.path.basename(pdf_path)
                base_name = os.path.splitext(filename)[0]
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = os.path.join(self.output_dir, f"{base_name}_{timestamp}.txt")
            
            # Save the extracted text
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            print(f"Text extracted and saved to: {output_path}")
            return full_text, output_path
            
        except Exception as e:
            print(f"Error converting PDF to text: {str(e)}")
            raise


def main():
    """Main function to handle command line arguments and run the converter."""
    parser = argparse.ArgumentParser(description='Convert PDF files to text using Aspose.Words')
    parser.add_argument('pdf_path', help='Path to the PDF file to convert')
    parser.add_argument('-o', '--output', help='Path to save the output text file (optional)')
    
    args = parser.parse_args()
    
    converter = PdfToTextConverter()
    try:
        _, output_path = converter.convert_pdf_to_text(args.pdf_path, args.output)
        print(f"PDF successfully converted to text. Output saved to: {output_path}")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
