import io
from typing import Dict, Any, List
import pypdf
import re

class PDFResumeParser:
    def __init__(self):
        pass

    def extract_text_from_bytes(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract text and structure from PDF bytes."""
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            num_pages = len(reader.pages)
            full_text = []
            pages_text = []

            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_text.append(text)
                full_text.append(text)

            combined_text = "\n\n".join(full_text)
            
            # Simple section boundary detector
            sections = self._segment_sections(combined_text)

            return {
                "success": True,
                "num_pages": num_pages,
                "text": combined_text,
                "pages": pages_text,
                "sections": sections
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "num_pages": 0,
                "sections": {}
            }

    def extract_text_from_docx_bytes(self, docx_bytes: bytes) -> Dict[str, Any]:
        """Extract text and structure from Word .docx bytes using standard library."""
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
                xml_content = zf.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for elem in tree.iter():
                    if elem.tag.endswith("}p") or elem.tag == "p":
                        p_text = "".join(node.text for node in elem.iter() if node.text).strip()
                        if p_text:
                            paragraphs.append(p_text)
                combined_text = "\n\n".join(paragraphs)
                sections = self._segment_sections(combined_text)
                return {
                    "success": True,
                    "num_pages": 1,
                    "text": combined_text,
                    "pages": [combined_text],
                    "sections": sections,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "num_pages": 0,
                "sections": {},
            }


    def _segment_sections(self, text: str) -> Dict[str, str]:
        """Identify standard resume sections: Experience, Education, Skills, Projects, Certifications."""
        section_headers = [
            ("summary", re.compile(r"(summary|profile|about me|objective)", re.IGNORECASE)),
            ("skills", re.compile(r"(skills|technical skills|competencies|technologies)", re.IGNORECASE)),
            ("experience", re.compile(r"(experience|work experience|employment|work history)", re.IGNORECASE)),
            ("projects", re.compile(r"(projects|key projects|personal projects)", re.IGNORECASE)),
            ("education", re.compile(r"(education|academic background|qualifications)", re.IGNORECASE)),
            ("certifications", re.compile(r"(certifications|certificates|licenses)", re.IGNORECASE)),
        ]

        lines = text.split("\n")
        sections: Dict[str, List[str]] = {
            "summary": [],
            "skills": [],
            "experience": [],
            "projects": [],
            "education": [],
            "certifications": [],
            "general": []
        }

        current_section = "general"

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue

            # Check if line matches a header pattern
            matched = False
            if len(trimmed.split()) <= 4: # Headers are usually short
                for sec_key, pattern in section_headers:
                    if pattern.fullmatch(trimmed.strip(":")):
                        current_section = sec_key
                        matched = True
                        break

            if not matched:
                sections[current_section].append(trimmed)

        return {k: "\n".join(v) for k, v in sections.items() if v}

pdf_parser = PDFResumeParser()
