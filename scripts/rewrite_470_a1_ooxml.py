"""Rewrite the Mentor Market 470 A1 DOCX using its existing Word template.

This standard-library fallback keeps the supplied formatting without requiring
python-docx. It reuses the original heading, body, bullet, section-break, and
picture XML as style templates, replaces the text, and embeds the class diagram
rendered from ``Mentor_Market_Class_Diagram.drawio``.
"""

from __future__ import annotations

import ast
from copy import deepcopy
from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "documentation" / "470_A1_Mentor_Market.docx"
CONTENT_SOURCE = ROOT / "scripts" / "generate_470_a1_docx.py"
DIAGRAM_PATH = (
    ROOT
    / "documentation"
    / "assignment_assets"
    / "mentor_market_class_diagram_from_drawio.png"
)

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"

NS = {"w": W, "a": A, "wp": WP, "pic": PIC, "r": R}


def qn(namespace, local_name):
    return f"{{{namespace}}}{local_name}"


def load_content_constants():
    source = CONTENT_SOURCE.read_text(encoding="utf-8")
    tree = ast.parse(source)
    wanted = {
        "Q1_INTRO",
        "FUNCTIONAL_USER_INTRO",
        "FUNCTIONAL_USER_REQUIREMENTS",
        "FUNCTIONAL_SYSTEM_INTRO",
        "FUNCTIONAL_SYSTEM_REQUIREMENTS",
        "NON_FUNCTIONAL_INTRO",
        "NON_FUNCTIONAL_REQUIREMENTS",
        "Q2_EXPLANATIONS",
        "Q3_INTRO",
        "Q3_MVC_COMPONENTS",
        "Q3_ROUTES",
        "Q3_MVC_REASONS",
        "Q3_REQUEST_CYCLE",
        "Q3_ALTERNATIVE",
    }
    values = {}
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in wanted:
                values[target.id] = ast.literal_eval(node.value)
    missing = wanted.difference(values)
    if missing:
        raise ValueError(f"Missing content constants: {', '.join(sorted(missing))}")
    return values


def register_source_namespaces(xml_bytes):
    for _, namespace in ET.iterparse(BytesIO(xml_bytes), events=("start-ns",)):
        prefix, uri = namespace
        try:
            ET.register_namespace(prefix, uri)
        except ValueError:
            # Reserved prefixes such as ns0 are safe to let ElementTree assign.
            pass


def paragraph_text(paragraph):
    return "".join(
        text.text or "" for text in paragraph.findall(".//w:t", NS)
    )


def replace_text(paragraph, text, bullet=False):
    clone = deepcopy(paragraph)
    text_nodes = clone.findall(".//w:t", NS)
    if not text_nodes:
        raise ValueError("The selected paragraph template has no text node")
    if bullet:
        # The first text node is the manual solid-circle marker. The last one
        # is the requirement text, separated by a real Word tab element.
        for node in text_nodes[1:-1]:
            node.text = ""
        text_nodes[-1].text = text
    else:
        text_nodes[0].text = text
        for node in text_nodes[1:]:
            node.text = ""
    return clone


def set_first_heading_spacing(paragraph):
    p_pr = paragraph.find("w:pPr", NS)
    if p_pr is None:
        return
    spacing = p_pr.find("w:spacing", NS)
    if spacing is not None:
        spacing.set(qn(W, "before"), "0")


def make_heading(template, text, first=False):
    paragraph = replace_text(template, text)
    if first:
        set_first_heading_spacing(paragraph)
    return paragraph


def make_body(template, text):
    return replace_text(template, text)


def make_bullet(template, text):
    return replace_text(template, text, bullet=True)


def update_landscape_section(section_break):
    clone = deepcopy(section_break)
    sect_pr = clone.find(".//w:sectPr", NS)
    if sect_pr is None:
        raise ValueError("Landscape section template is missing section properties")
    page_size = sect_pr.find("w:pgSz", NS)
    if page_size is not None:
        # Set the geometry explicitly so repeated rewrites remain idempotent
        # even after the document gains the extra portrait Q2-introduction page.
        page_size.set(qn(W, "w"), "15840")
        page_size.set(qn(W, "h"), "12240")
        page_size.set(qn(W, "orient"), "landscape")
    margins = sect_pr.find("w:pgMar", NS)
    if margins is not None:
        # 0.15-inch margins make the detailed Draw.io diagram readable while
        # retaining the landscape Letter page used by the existing document.
        for key in ("top", "right", "bottom", "left"):
            margins.set(qn(W, key), "216")
    return clone


def update_picture(picture_paragraph):
    clone = deepcopy(picture_paragraph)
    # Q2's explanation is on the preceding portrait page, leaving this
    # landscape page for a large, readable rendering of the Draw.io canvas.
    width_emu = int(9.8 * 914400)
    height_emu = int(width_emu * 1550 / 1900)

    extent = clone.find(".//wp:extent", NS)
    if extent is not None:
        extent.set("cx", str(width_emu))
        extent.set("cy", str(height_emu))
    transform_extent = clone.find(".//a:xfrm/a:ext", NS)
    if transform_extent is not None:
        transform_extent.set("cx", str(width_emu))
        transform_extent.set("cy", str(height_emu))
    doc_pr = clone.find(".//wp:docPr", NS)
    if doc_pr is not None:
        doc_pr.set("title", "Mentor Market UML Class Diagram")
        doc_pr.set(
            "descr",
            "Class diagram rendered from the editable Mentor_Market_Class_Diagram.drawio source.",
        )
    return clone


def build_document_xml(document_xml):
    register_source_namespaces(document_xml)
    root = ET.fromstring(document_xml)
    # ElementTree drops unused versioned namespace declarations. Keeping an
    # mc:Ignorable value that names those removed prefixes makes some editors
    # reject the package, so the compatibility hint is removed.
    root.attrib.pop(qn(MC, "Ignorable"), None)
    body = root.find("w:body", NS)
    if body is None:
        raise ValueError("The Word document has no body")
    original = list(body)

    headings = [
        paragraph
        for paragraph in original
        if paragraph.tag == qn(W, "p")
        and paragraph_text(paragraph).strip()
        and paragraph.find("w:pPr/w:pStyle", NS) is not None
    ]
    bullets = [
        paragraph
        for paragraph in original
        if paragraph.tag == qn(W, "p")
        and paragraph_text(paragraph).startswith("●")
    ]
    bodies = [
        paragraph
        for paragraph in original
        if paragraph.tag == qn(W, "p")
        and paragraph_text(paragraph).strip()
        and not paragraph_text(paragraph).startswith("●")
        and paragraph.find("w:pPr/w:pStyle", NS) is None
        and paragraph.find(".//w:drawing", NS) is None
    ]
    section_breaks = [
        paragraph
        for paragraph in original
        if paragraph.tag == qn(W, "p")
        and paragraph.find(".//w:sectPr", NS) is not None
    ]
    picture_paragraphs = [
        paragraph
        for paragraph in original
        if paragraph.tag == qn(W, "p")
        and paragraph.find(".//w:drawing", NS) is not None
    ]
    final_section = body.find("w:sectPr", NS)

    if not headings or not bullets or not bodies:
        raise ValueError("The template does not contain the required paragraph styles")
    if len(section_breaks) < 2 or not picture_paragraphs or final_section is None:
        raise ValueError("The template does not contain the required section or picture XML")

    heading_template = headings[1] if len(headings) > 1 else headings[0]
    bullet_template = bullets[0]
    body_template = bodies[0]
    portrait_break = section_breaks[0]
    landscape_break = update_landscape_section(section_breaks[1])
    picture_template = update_picture(picture_paragraphs[0])
    final_section = deepcopy(final_section)

    content = load_content_constants()
    q1_intro = content["Q1_INTRO"]
    functional_user_intro = content["FUNCTIONAL_USER_INTRO"]
    functional_user_requirements = content["FUNCTIONAL_USER_REQUIREMENTS"]
    functional_system_intro = content["FUNCTIONAL_SYSTEM_INTRO"]
    functional_system_requirements = content["FUNCTIONAL_SYSTEM_REQUIREMENTS"]
    non_functional_intro = content["NON_FUNCTIONAL_INTRO"]
    non_functional_requirements = content["NON_FUNCTIONAL_REQUIREMENTS"]
    q2_explanations = content["Q2_EXPLANATIONS"]
    q3_intro = content["Q3_INTRO"]
    mvc_components = content["Q3_MVC_COMPONENTS"]
    routes = content["Q3_ROUTES"]
    mvc_reasons = content["Q3_MVC_REASONS"]
    request_cycle = content["Q3_REQUEST_CYCLE"]
    alternative = content["Q3_ALTERNATIVE"]

    for child in list(body):
        body.remove(child)

    body.append(
        make_heading(
            heading_template,
            "Q1 — Functional and Non-Functional Requirements",
            first=True,
        )
    )
    body.append(make_body(body_template, q1_intro))
    body.append(make_heading(heading_template, "Functional Requirements"))
    body.append(make_heading(heading_template, "Functional User Requirements"))
    body.append(make_body(body_template, functional_user_intro))
    for requirement in functional_user_requirements:
        body.append(make_bullet(bullet_template, requirement))

    body.append(make_heading(heading_template, "Functional System Requirements"))
    body.append(make_body(body_template, functional_system_intro))
    for title, requirements in functional_system_requirements:
        body.append(make_heading(heading_template, title))
        for requirement in requirements:
            body.append(make_bullet(bullet_template, requirement))

    body.append(make_heading(heading_template, "Non-Functional Requirements"))
    body.append(make_body(body_template, non_functional_intro))
    for title, requirements in non_functional_requirements:
        body.append(make_heading(heading_template, title))
        for requirement in requirements:
            body.append(make_bullet(bullet_template, requirement))

    body.append(deepcopy(portrait_break))
    body.append(
        make_heading(
            heading_template,
            "Q2 — UML Class Diagram",
            first=True,
        )
    )
    for explanation in q2_explanations:
        body.append(make_body(body_template, explanation))
    body.append(deepcopy(portrait_break))
    body.append(picture_template)
    body.append(landscape_break)

    body.append(
        make_heading(
            heading_template,
            "Q3 — Why MVC Is the Best Fit for Mentor Market",
            first=True,
        )
    )
    body.append(make_body(body_template, q3_intro))
    body.append(make_heading(heading_template, "Model, View and Controller in Mentor Market"))
    for item in mvc_components:
        body.append(make_body(body_template, item))

    body.append(
        make_heading(
            heading_template,
            "Routes and the Request Cycle",
        )
    )
    body.append(make_body(body_template, routes))
    body.append(
        make_heading(
            heading_template,
            "Example Request Cycle — Publishing a Tutor Service",
        )
    )
    for number, item in enumerate(request_cycle, start=1):
        body.append(make_body(body_template, f"{number}. {item}"))

    body.append(make_heading(heading_template, "Why MVC Fits Mentor Market"))
    for item in mvc_reasons:
        body.append(make_body(body_template, item))

    body.append(
        make_heading(
            heading_template,
            "A Practical Alternative — Layered Architecture",
        )
    )
    for item in alternative:
        body.append(make_body(body_template, item))

    body.append(final_section)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_docx():
    if not DOCX_PATH.exists():
        raise FileNotFoundError(f"Template DOCX not found: {DOCX_PATH}")
    if not DIAGRAM_PATH.exists():
        raise FileNotFoundError(f"Rendered Draw.io diagram not found: {DIAGRAM_PATH}")

    temporary = DOCX_PATH.with_suffix(".rewritten.docx")
    with ZipFile(DOCX_PATH, "r") as source:
        document_xml = source.read("word/document.xml")
        revised_xml = build_document_xml(document_xml)
        diagram_bytes = DIAGRAM_PATH.read_bytes()

        with ZipFile(temporary, "w", compression=ZIP_DEFLATED) as output:
            for info in source.infolist():
                if info.filename == "word/document.xml":
                    data = revised_xml
                elif info.filename == "word/media/image1.png":
                    data = diagram_bytes
                else:
                    data = source.read(info.filename)
                output.writestr(info, data)

    with ZipFile(temporary, "r") as check:
        bad_member = check.testzip()
        if bad_member is not None:
            raise ValueError(f"Invalid DOCX package member: {bad_member}")
        ET.fromstring(check.read("word/document.xml"))
        if check.read("word/media/image1.png") != DIAGRAM_PATH.read_bytes():
            raise ValueError("The Draw.io diagram was not embedded correctly")

    temporary.replace(DOCX_PATH)
    return DOCX_PATH


if __name__ == "__main__":
    print(rewrite_docx())
