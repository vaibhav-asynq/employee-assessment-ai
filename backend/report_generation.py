from fpdf import FPDF
from fpdf.enums import XPos, YPos
import textwrap

from fpdf import FPDF
from fpdf.enums import XPos, YPos
import textwrap

class UTF8Report(FPDF):
    """Custom PDF class for generating 360 feedback reports with proper formatting"""
    
    def __init__(self, header_txt):
        super().__init__()
        # Define page margins in millimeters
        self.left_margin = 20    # Distance from left edge of page
        self.right_margin = 20   # Distance from right edge of page
        self.top_margin = 8     # Distance from top edge of page
        self.header_height = 15  # Height reserved for header section
        self.header_txt = header_txt
        
        # Set page margins and properties
        self.set_margins(
            self.left_margin,                        # Left margin
            self.top_margin + self.header_height,    # Top margin plus header space
            self.right_margin                        # Right margin
        )
        
        # self.add_font('DejaVu', '', 'DejaVuSans.ttf', uni=True)
        # self.add_font('DejaVu', 'B', 'DejaVuSans-Bold.ttf', uni=True)
        # Enable auto page breaks with 15mm bottom margin
        self.set_auto_page_break(auto=True, margin=15)
        self.add_page()
            
    def header(self):
        """Define header that appears on each page"""
        # Store current position
        current_x = self.get_x()
        current_y = self.get_y()
        
        # Position header at top of page
        self.set_xy(self.left_margin, self.top_margin)
        
        # Set header text properties
        self.set_font('Helvetica', '', 11)  # Font family, style, size
        self.cell(
            w=0,                            # Width (0 = extend to right margin)
            h=10,                           # Height of cell
            txt=self.header_txt,
            new_x=XPos.LMARGIN,             # Move to left margin after
            new_y=YPos.NEXT,                # Move to next line after
            align='L'                       # Left alignment
        )
        
        # Adjust content position on subsequent pages
        if self.page_no() > 1:
            self.set_y(self.top_margin + self.header_height)
            
    def underlined_title(self, title):
        """Create an underlined section title"""
        self.set_font('Helvetica', 'B', 11)
        title_width = self.get_string_width(title)  # Get width to determine underline length
        
        # Add title
        self.cell(
            w=0, 
            h=6,                            # Height of title
            txt=title,
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT
        )
        
        # Add underline
        current_y = self.get_y()
        self.line(
            self.l_margin+1,                  # Start x
            current_y,                      # Start y
            self.l_margin + title_width+1,    # End x (title width)
            current_y                       # End y
        )
        self.ln(0.5)  # Add space after underline
    
    def calculate_text_width(self, text):
        """Calculate width of text string in current font"""
        return self.get_string_width(text)
    
    def wrap_text(self, text, max_width):
        """Wrap text to fit within specified width"""
        print(text)
        words = text.split()
        lines = []
        current_line = []
        current_width = 0
        
        # Process each word
        for word in words:
            word_width = self.calculate_text_width(word + ' ')
            if current_width + word_width <= max_width:
                current_line.append(word)
                current_width += word_width
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_width = word_width
                
        # Add last line if exists
        if current_line:
            lines.append(' '.join(current_line))
            
        return lines
    
    def add_numbered_section(self, number, title, content, available_width):
        """Add a numbered section with title and content"""
        # Title part
        self.set_font('Helvetica', 'B', 11)
        number_width = self.get_string_width(f"{number}. ")
        title_width = self.get_string_width(title)
        
        # Adjust starting position to match content alignment
        self.set_x(20)  # Set to same position as content
        self.cell(number_width+2, 5, f"{number}.", 0, 0)
        self.cell(title_width, 5, title, 0, 0)
        
        # Calculate start position for content after title
        start_x = 20 + number_width + title_width + 4
        
        # Content part with justified alignment
        self.set_font('Helvetica', '', 11)
        
        # Split content into first line and rest
        words = content.split()
        first_line = []
        current_width = 0
        
        first_line_width = available_width - (start_x - self.l_margin)
        
        for word in words:
            word_width = self.get_string_width(word + ' ')
            if current_width + word_width <= first_line_width:
                first_line.append(word)
                current_width += word_width
            else:
                break
                
        # Print first line right after title
        if first_line:
            self.set_x(start_x)
            first_text = ' '.join(first_line)
            self.cell(first_line_width, 5, first_text, 0, 1)
        
        # Process remaining content
        remaining_text = ' '.join(words[len(first_line):])
        if remaining_text:
            self.set_x(27)
            remaining_width = available_width - (27 - self.l_margin)
            self.multi_cell(w=remaining_width, h=5, txt=remaining_text, align='J')
        
        # self.ln(3)

def create_360_feedback_report(output_file, data, header_txt):
    pdf = UTF8Report(header_txt)
    available_width = pdf.w - 40
    
    pdf.ln(5)
    
    pdf.underlined_title('Strengths')
    for i, (title, content) in enumerate(data.strengths.items(), 1):
        pdf.add_numbered_section(i, title, content, available_width)
    
    pdf.ln(4)
    pdf.underlined_title('Areas to Target')
    for i, (title, content) in enumerate(data.areas_to_target.items(), 1):
        pdf.add_numbered_section(i, title, content, available_width)
    
    pdf.ln(4)
    pdf.underlined_title('Next Steps and Potential Actions')
    
    for i, item in enumerate(data.next_steps):
        if hasattr(item, 'main'):
            # Main bullet with sub-points
            pdf.set_font('Symbol', '', 16)
            pdf.set_x(20)
            pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT)
            
            pdf.set_font('Helvetica', '', 11)
            lines = pdf.wrap_text(item.main, available_width - 15)
            first = True
            for line in lines:
                if first:
                    if i != 0:
                        pdf.set_font('Helvetica', 'B', 11)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    first = False
                else:
                    pdf.set_font('Helvetica', '', 11)
                    pdf.set_x(25)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            for sub_point in item.sub_points:
                pdf.set_x(30)
                if i == 0:
                    pdf.set_font('Symbol', '', 16)
                    pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT)
                else:
                    pdf.set_font('ZapfDingbats', '', 7)
                    pdf.cell(5, 5, 'm', new_x=XPos.RIGHT)
                
                pdf.set_font('Helvetica', '', 11)
                lines = pdf.wrap_text(sub_point, available_width - 35)
                first = True
                for line in lines:
                    if first:
                        pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                        first = False
                    else:
                        pdf.set_x(35)
                        pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
        else:
            # Regular bullet point (string)
            pdf.set_x(20)
            pdf.set_font('Symbol', '', 16)
            pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT)
            
            pdf.set_font('Helvetica', '', 11)
            lines = pdf.wrap_text(str(item), available_width - 15)
            first = True
            for line in lines:
                if first:
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    first = False
                else:
                    pdf.set_x(25)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(1)

    pdf.output(output_file)

def create_360_feedback_report_for_word(output_file, data, header_txt):
    """
    Create a 360 feedback report optimized for Word conversion with standard bullet points
    that convert properly when using Aspose to convert to DOCX format.
    """
    pdf = UTF8Report(header_txt)
    available_width = pdf.w - 40
    
    pdf.ln(5)
    
    pdf.underlined_title('Strengths')
    for i, (title, content) in enumerate(data.strengths.items(), 1):
        pdf.add_numbered_section(i, title, content, available_width)
    
    pdf.ln(4)
    pdf.underlined_title('Areas to Target')
    for i, (title, content) in enumerate(data.areas_to_target.items(), 1):
        pdf.add_numbered_section(i, title, content, available_width)
    
    pdf.ln(4)
    pdf.underlined_title('Next Steps and Potential Actions')
    
    for i, item in enumerate(data.next_steps):
        if hasattr(item, 'main'):
            # Main bullet with sub-points - using Symbol font with bullet character
            pdf.set_font('Symbol', '', 16)
            pdf.set_x(20)
            pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT)  # Character code 149 is a bullet point in Symbol font
            
            pdf.set_font('Helvetica', '', 11)
            lines = pdf.wrap_text(item.main, available_width - 15)
            first = True
            for line in lines:
                if first:
                    if i != 0:
                        pdf.set_font('Helvetica', 'B', 11)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    first = False
                else:
                    pdf.set_font('Helvetica', '', 11)
                    pdf.set_x(25)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            for sub_point in item.sub_points:
                pdf.set_x(30)
                
                pdf.set_font('Symbol', '', 16)
                pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT) # Same bullet character but smaller font
                
                pdf.set_font('Helvetica', '', 11)
                lines = pdf.wrap_text(sub_point, available_width - 35)
                first = True
                for line in lines:
                    if first:
                        pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                        first = False
                    else:
                        pdf.set_x(35)
                        pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
        else:
            # Regular bullet point (string) - using Symbol font with bullet character
            pdf.set_x(20)
            pdf.set_font('Symbol', '', 16)
            pdf.cell(5, 5, chr(183), new_x=XPos.RIGHT)  # Character code 149 is a bullet point in Symbol font
            
            pdf.set_font('Helvetica', '', 11)
            lines = pdf.wrap_text(str(item), available_width - 15)
            first = True
            for line in lines:
                if first:
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    first = False
                else:
                    pdf.set_x(25)
                    pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(1)

    pdf.output(output_file)

# Sample data remains the same
if __name__ == "__main__":
    # Original report data
    sample_data = {
        "name": "Ian Fujiyama",
        "date": "June 2024",
        "strengths": {
            "Business judgment": "Described as smart, quick, analytical, even cerebral, Ian is an expert on his market. He is also seen as particularly strategic, tapping deep wisdom and experience that allows him to spot opportunities as well as risks and give his companies thoughtful guidance. All of this leads to an excellent sense of judgment, according to stakeholders. They admire the accuracy of his insights, see him as an astute investor, and describe him as a formidable negotiator, all founded on these strong thinking skills.",
            
            "Integrity and trust": "He puts time into developing healthy relationships creating constructive collaboration, with his portfolio companies as well as inside Carlyle. Polished, polite, even keeled, he is seen as setting a tone for balance and stability. With high EQ, he reads the room well and is able to tap what other people care about and gauge their receptivity to his ideas. His interpersonal savvy, combined with his effort to invest in other people and interact with them transparently and authentically leads to a reputation of character and integrity.",
            
            "People development": "Ian has a respectful, hands-off leadership style that allows his team room to operate. He lets them grow into their roles yet tries to make himself available to support them, remove obstacles, and give them guidance and advice when they need it. Also, he stretches them by involving them in new projects, situations, and leadership roles. He can spot talent and invests intentionally in their careers; stretching, sponsoring, and coaching them to build their capabilities. Consequently, he is seen as having built a loyal, deep, and expert team."
        },
        "areas_to_target": {
            "Providing direction": "A naturally empowering leader, his hands-off style can be overused at times. Although he responds and reacts when his team needs him, there are situations where he can proactively take the lead and more quickly accomplish things based on his unique position and role. For example, stakeholders report times where he could have involved himself earlier in deals or in solving problems and been clearer and more directive around expectations and deadlines. His efforts to empower may need to be balanced with the efficiency of clarity.",
            
            "Pushing the team": "Relatedly, he can encourage his team to accomplish more, both day-to-day and in their longer-term development. He stretches and advises, but his development of the team comes across as passive: he does not push them to build out their networks, give them frequent and direct feedback and teaching, or actively work to get his deep lessons of experience into the team. Also, he is seen as slow to address performance issues or to hold the team accountable to superior performance.",
            
            "Confident brand": "Stakeholders highly value Ian's skills and experience and want to see him have an even broader impact on the firm. His brand is one of intelligence and humility. They would like to see him add to that more instances of command and confidence, leveraging his strong credibility to take charge where appropriate and voice his opinions forcefully. In addition, he can continue strengthening his network and marketing himself, and the team, constructively yet actively within the firm and externally as well."
        },
        "next_steps": [
            {
                "main": "Prepare to have a discussion with Brian and Steve after you have had time for reflection and they receive this report. Make sure you think through:",
                "sub_points": [
                    "What did I hear from the feedback that was new or different than I expected?",
                    "What resonated most for me? How does it connect to what I heard from other historical feedback I've received?",
                    "What am I focused on in the immediate short term and for the rest of 2024?",
                    "What kind of support do I need from Brian, Steve, Jeannine, or others?"
                ]
            },
            "Ian, after three years in the Sector Head role, you find yourself in USBO's most mature sector while being pulled into more strategic, fund-level initiatives. This appeals to your need for having an impact, continued challenge and learning, and increasing responsibility. Keep those needs in mind as you think through these suggestions for development.",
            {
                "main": "To provide more direction.",
                "sub_points": [
                    "Ahead of time, think through the style and approach you want to take in key situations. Make a conscious decision about when to let your team take the lead, when to take control yourself, when to facilitate consensus, and when be directive.",
                    "Be clear when speed, or your unique expertise, is needed and when the situation allows for a more empowering approach.",
                    "Set a high bar and be clear what your expectations are for performance and excellence."
                ]
            },
            {
                "main": "To push and empower the team.",
                "sub_points": [
                    "Take an active role in developing the team and holding them accountable. Monitor their progress and give them frequent feedback to keep them both on track and learning.",
                    "Address performance issues quickly; they don't get better on their own. You have excellent people skills and can manage problems effectively, with tact and support.",
                    "Consider reading The Versatile Leader: Make the Most of Your Strengths Without Overdoing It by Kaplan and Kaiser. It's a bit dated but a good resource on rounding out your natural leadership with additional learned styles."
                ]
            },
            {
                "main": "To develop a memorable brand.",
                "sub_points": [
                    "You are already being pulled into broader initiatives. Take advantage of those as opportunities to make new connections throughout the firm and outside of the fund.",
                    "Make sure you have a pithy summary of the sector ready to share at a moment's notice. Leaders often have a 30-second elevator speech and 60-second hallway speech that contains memorable headlines and summaries for people who ask about the sector.",
                    "Don't hold back on your opinions. Your calm, collaborative style works in most situations, but others require a firm, direct voice. Your knowledge is a key asset: don't be afraid to share it because others are asking for it."
                ]
            }
        ]
    }

    create_360_feedback_report("360_feedback_report.pdf", sample_data)
    print("Done")
