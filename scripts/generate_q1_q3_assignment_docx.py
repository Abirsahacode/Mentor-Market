"""Generate a basic Times New Roman DOCX for the Mentor Market assignment.

The document intentionally uses only simple academic formatting:
US Letter paper, one-inch margins, Times New Roman, plain black headings,
numbered requirement identifiers, two diagrams, and no cover page, header,
or footer.

The implementation uses only Python's standard library and writes a minimal,
standards-compliant Office Open XML package.
"""

from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from pathlib import Path
import struct
from zipfile import ZIP_DEFLATED, ZipFile

from render_assignment_diagrams import CLASS_PNG, MVC_PNG, render_all


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "documentation" / "Mentor_Market_Full_Assignment.docx"
FONT = "Times New Roman"


FUNCTIONAL_REQUIREMENTS = [
    (
        "1. Student, Tutor, and Admin Dashboards",
        [
            (
                "FR1.1",
                "After successful authentication, the system shall provide each "
                "student, tutor, and administrator with a workspace appropriate "
                "to their role.",
            ),
            (
                "FR1.2",
                "The student dashboard shall display upcoming and completed "
                "classes, received applications, learning performance, and "
                "relevant learning actions.",
            ),
            (
                "FR1.3",
                "The tutor dashboard shall display upcoming and completed "
                "classes, submitted applications, earnings, and shortcuts for "
                "creating services and finding students.",
            ),
            (
                "FR1.4",
                "The administrator dashboard shall summarize users, tutor "
                "services, student requests, applications, bookings, payments, "
                "popular subjects, pending verifications, and unresolved reports.",
            ),
            (
                "FR1.5",
                "Each dashboard shall provide role-specific navigation and shall "
                "prevent users from accessing another role's protected pages or "
                "actions.",
            ),
        ],
    ),
    (
        "2. Admin Marketplace and Content Moderation",
        [
            (
                "FR2.1",
                "The system shall allow administrators to view and search user "
                "accounts, tutor services, student requests, reviews, "
                "verification requests, and submitted reports.",
            ),
            (
                "FR2.2",
                "The system shall allow administrators to inspect the information "
                "associated with a marketplace or moderation record before making "
                "a decision.",
            ),
            (
                "FR2.3",
                "Administrators shall be able to suspend and reactivate accounts, "
                "but the system shall not allow an administrator to suspend their "
                "own account.",
            ),
            (
                "FR2.4",
                "Administrators shall be able to approve or reject "
                "tutor-verification requests and provide feedback on their "
                "decisions.",
            ),
            (
                "FR2.5",
                "Administrators shall be able to investigate and resolve "
                "submitted reports while recording the outcome of each case.",
            ),
            (
                "FR2.6",
                "Administrators shall be able to remove inappropriate tutor "
                "services, student requests, and reviews after confirming the "
                "action.",
            ),
            (
                "FR2.7",
                "After a moderation action, the system shall refresh the affected "
                "information and report whether the action succeeded or failed.",
            ),
        ],
    ),
    (
        "3. Course Catalog Search, Filtering, and Sorting",
        [
            (
                "FR3.1",
                "The system shall allow students to browse active and published "
                "courses or teaching services.",
            ),
            (
                "FR3.2",
                "Students shall be able to search the catalog by course title, "
                "subject, level, description, or tutor name.",
            ),
            (
                "FR3.3",
                "Students shall be able to filter catalog results by subject, "
                "teaching mode, trial-class availability, and maximum price.",
            ),
            (
                "FR3.4",
                "Students shall be able to sort catalog results by recommended "
                "order, tutor rating, lowest price, or newest publication.",
            ),
            (
                "FR3.5",
                "The system shall apply searching, filtering, and sorting together "
                "while keeping the selected criteria visible.",
            ),
            (
                "FR3.6",
                "The catalog shall initially display eight matching courses and "
                "shall allow students to load additional results in batches.",
            ),
            (
                "FR3.7",
                "When no course matches the selected criteria, the system shall "
                "display an explanatory message and provide an option to clear "
                "the search and filters.",
            ),
        ],
    ),
    (
        "4. Public Home, About, How It Works, and Contact Pages",
        [
            (
                "FR4.1",
                "Visitors shall be able to access the Home, About, How It Works, "
                "and Contact pages without signing in.",
            ),
            (
                "FR4.2",
                "The Home page shall introduce Mentor Market and provide actions "
                "for exploring tutors or creating an account.",
            ),
            (
                "FR4.3",
                "The About page shall explain the platform's purpose and its "
                "benefits for students, tutors, and marketplace trust.",
            ),
            (
                "FR4.4",
                "The How It Works page shall explain the main steps for "
                "discovering tutors, comparing teaching options, requesting "
                "classes, and managing the learning relationship.",
            ),
            (
                "FR4.5",
                "The Contact page shall display the support email address, "
                "telephone number, and office location, with usable email and "
                "telephone links.",
            ),
            (
                "FR4.6",
                "All public pages shall provide consistent navigation, branding, "
                "and links to the main marketplace actions.",
            ),
        ],
    ),
    (
        "5. Detailed Course Pages with Learning Paths",
        [
            (
                "FR5.1",
                "The system shall retrieve a selected course using its unique "
                "identifier and shall display a not-found message when the course "
                "is unavailable.",
            ),
            (
                "FR5.2",
                "Each course page shall display the title, subject, level, "
                "description, price, teaching mode, session duration, trial "
                "availability, and tutor information.",
            ),
            (
                "FR5.3",
                "Each course page shall display the tutor's verification status, "
                "rating, experience, and available student reviews.",
            ),
            (
                "FR5.4",
                "The system shall present learning outcomes and a suggested "
                "subject-based learning path containing ordered modules and "
                "lessons.",
            ),
            (
                "FR5.5",
                "Students shall be able to expand and collapse individual "
                "learning-path modules without leaving the course page.",
            ),
            (
                "FR5.6",
                "When a demonstration video is available, the system shall provide "
                "playback controls while keeping the written course information "
                "accessible.",
            ),
            (
                "FR5.7",
                "The system shall show available class times and allow an "
                "authenticated student to request a trial or regular class "
                "directly from the course page.",
            ),
        ],
    ),
    (
        "6. Tutor Course or Service Creation and Management",
        [
            (
                "FR6.1",
                "The system shall allow only an authenticated tutor to create a "
                "course or teaching-service post.",
            ),
            (
                "FR6.2",
                "A tutor shall be able to provide a title, subject, level, price, "
                "teaching mode, availability, and description for a service.",
            ),
            (
                "FR6.3",
                "A tutor shall be able to add an optional location, thumbnail, "
                "demonstration video, and trial-class option.",
            ),
            (
                "FR6.4",
                "The system shall reject missing or invalid required information "
                "and identify the fields that must be corrected.",
            ),
            (
                "FR6.5",
                "The system shall display a live preview of the service card while "
                "the tutor enters or updates its information.",
            ),
            (
                "FR6.6",
                "Tutors shall be able to view, update, publish, pause, reactivate, "
                "and delete their own courses or services.",
            ),
            (
                "FR6.7",
                "The system shall request confirmation before deleting a service "
                "and shall prevent one tutor from modifying another tutor's "
                "content.",
            ),
            (
                "FR6.8",
                "An active service shall appear in course discovery, while a "
                "paused or deleted service shall no longer appear as an available "
                "course.",
            ),
        ],
    ),
]


NON_FUNCTIONAL_REQUIREMENTS = [
    (
        "Product Requirements",
        [
            (
                "NFR-P1",
                "During a five-minute test involving 20 concurrent clients and at "
                "least 500 non-media requests, the system shall complete at least "
                "95% of responses within two seconds.",
            ),
            (
                "NFR-P2",
                "The deployed system shall maintain at least 99.5% monthly "
                "availability, excluding maintenance announced at least 24 hours "
                "in advance.",
            ),
            (
                "NFR-P3",
                "The system shall return no more than 100 catalog records in one "
                "API response and shall use pagination or progressive loading for "
                "additional records.",
            ),
            (
                "NFR-P4",
                "The system shall store passwords using adaptive hashing, require "
                "a valid authentication token for protected operations, and "
                "enforce role and ownership restrictions.",
            ),
            (
                "NFR-P5",
                "The server shall validate submitted text, numbers, identifiers, "
                "statuses, and URLs before changing stored information.",
            ),
            (
                "NFR-P6",
                "Related database updates shall either complete successfully "
                "together or leave the previous valid data unchanged.",
            ),
            (
                "NFR-P7",
                "At viewport widths of 360, 768, and 1280 pixels, the public "
                "pages, catalog, forms, and dashboards shall remain usable without "
                "unintended horizontal scrolling.",
            ),
            (
                "NFR-P8",
                "All interactive functions shall support keyboard operation, "
                "visible focus, labelled form controls, and text alternatives for "
                "informative images.",
            ),
            (
                "NFR-P9",
                "The system shall provide distinguishable loading, success, empty, "
                "and error states and shall request confirmation before "
                "destructive actions.",
            ),
            (
                "NFR-P10",
                "Essential course and tutor information shall remain readable "
                "when an external image or demonstration video fails to load.",
            ),
        ],
    ),
    (
        "Organisational Requirements",
        [
            (
                "NFR-O1",
                "The project shall use React with Vite for the interface, Node.js "
                "with Express for the server, and MySQL for persistent storage.",
            ),
            (
                "NFR-O2",
                "The backend shall follow MVC and shall keep routes, controllers, "
                "and models in separate modules.",
            ),
            (
                "NFR-O3",
                "The backend shall use parameterized database queries, while setup "
                "instructions, database definitions, API examples, and essential "
                "automated tests shall be kept current.",
            ),
        ],
    ),
    (
        "External Requirements",
        [
            (
                "NFR-E1",
                "The frontend and backend shall exchange information through HTTP "
                "requests and JSON responses so that the API can interoperate with "
                "the web interface and independent API clients.",
            ),
            (
                "NFR-E2",
                "Public pages and responses shall not expose password hashes, "
                "authentication tokens, private contact details, or administrative "
                "information.",
            ),
        ],
    ),
]


Q3_PARAGRAPHS = [
    (
        "MVC is the best fit for Mentor Market because the platform presents the "
        "same information in several different ways. A course may appear as a "
        "catalog card for a student, a detailed page with a learning path, an "
        "item in a tutor's management workspace, and a record in the "
        "administrator's moderation interface. Students, tutors, administrators, "
        "and public visitors also perform different actions on this shared "
        "information. MVC separates these responsibilities so that the system "
        "remains manageable as its features grow."
    ),
    (
        "The Model is responsible for data and data-related operations involving "
        "users, tutor profiles, courses or service posts, bookings, reviews, "
        "verification requests, and reports. These records are stored in MySQL "
        "and can be retrieved, created, updated, or deleted as required."
    ),
    (
        "The View consists of the React pages and components presented to users. "
        "These include the role-based dashboards, public pages, searchable course "
        "catalog, detailed course pages, tutor service forms, and administrative "
        "moderation screens. Because presentation is separated from data "
        "handling, a page can be redesigned without changing how its information "
        "is stored."
    ),
    (
        "The Controller receives requests, processes user input, coordinates the "
        "required operation, and returns a response to the View. For example, "
        "when a tutor publishes a service, the React View submits the information "
        "to an Express route. Authentication, role checks, and validation are "
        "applied before the Controller coordinates the database operation. The "
        "Controller then returns a JSON response, which React uses to update the "
        "interface."
    ),
]


MVC_BENEFITS = [
    "The same data and logic can be reused across multiple interfaces.",
    "Frontend and backend developers can work in parallel using agreed request and response formats.",
    "Models, controllers, and views can be tested independently.",
    "Interface changes have limited impact on database logic.",
    "New dashboards, search options, or moderation tools can be introduced without restructuring the entire application.",
]


Q3_CONCLUSION = (
    "MVC introduces more files and structure than a small monolithic application, "
    "but this additional complexity is justified because Mentor Market contains "
    "multiple roles, interfaces, and connected workflows."
)


ALTERNATIVE_PARAGRAPHS = [
    (
        "If an alternative architecture were required, I would choose Layered "
        "Architecture. Mentor Market could be divided into a presentation layer "
        "for React pages, an application layer for routes and request handling, a "
        "business layer for course management, search, moderation, and "
        "authorization rules, a data-access layer for database operations, and a "
        "database layer for permanent storage."
    ),
    (
        "This architecture would isolate the main responsibilities of the system "
        "and allow a layer to be modified or replaced with limited impact on the "
        "others, provided that its interface remained consistent. It would also "
        "support incremental development, isolated testing, consistent security "
        "rules, and collaboration among teams responsible for different layers. "
        "Its main disadvantage is that every request must pass through several "
        "layers, which can add code and processing overhead. Nevertheless, it "
        "would be the strongest alternative for a larger version of Mentor Market "
        "with more complex business rules and security requirements."
    ),
]


def xml_text(value: str) -> str:
    return escape(value, quote=False)


def run_xml(
    text: str,
    *,
    bold: bool = False,
    italic: bool = False,
    size: int | None = None,
) -> str:
    properties = [
        (
            f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" '
            f'w:eastAsia="{FONT}" w:cs="{FONT}"/>'
        )
    ]
    if bold:
        properties.extend(["<w:b/>", "<w:bCs/>"])
    if italic:
        properties.extend(["<w:i/>", "<w:iCs/>"])
    if size is not None:
        properties.extend(
            [f'<w:sz w:val="{size}"/>', f'<w:szCs w:val="{size}"/>']
        )
    return (
        "<w:r><w:rPr>"
        + "".join(properties)
        + f'</w:rPr><w:t xml:space="preserve">{xml_text(text)}</w:t></w:r>'
    )


def paragraph_xml(
    runs: list[str],
    *,
    style: str | None = None,
    left: int | None = None,
    hanging: int | None = None,
    page_break_before: bool = False,
    after: int | None = None,
) -> str:
    properties: list[str] = []
    if style:
        properties.append(f'<w:pStyle w:val="{style}"/>')
    if page_break_before:
        properties.append("<w:pageBreakBefore/>")
    if left is not None:
        indent = f'<w:ind w:left="{left}"'
        if hanging is not None:
            indent += f' w:hanging="{hanging}"'
        indent += "/>"
        properties.append(indent)
    if after is not None:
        properties.append(
            f'<w:spacing w:after="{after}" w:line="276" w:lineRule="auto"/>'
        )
    p_pr = f"<w:pPr>{''.join(properties)}</w:pPr>" if properties else ""
    return f"<w:p>{p_pr}{''.join(runs)}</w:p>"


def heading(text: str, level: int, *, page_break_before: bool = False) -> str:
    style = {1: "Heading1", 2: "Heading2", 3: "Heading3"}[level]
    return paragraph_xml(
        [run_xml(text, bold=True)],
        style=style,
        page_break_before=page_break_before,
    )


def body(text: str) -> str:
    return paragraph_xml([run_xml(text)], style="Normal")


def requirement(label: str, text: str) -> str:
    return paragraph_xml(
        [run_xml(f"{label}: ", bold=True), run_xml(text)],
        style="Normal",
        left=360,
        hanging=360,
        after=80,
    )


def bullet(text: str) -> str:
    return paragraph_xml(
        [run_xml("• "), run_xml(text)],
        style="Normal",
        left=720,
        hanging=360,
        after=40,
    )


def caption(text: str) -> str:
    return (
        "<w:p>"
        "<w:pPr><w:jc w:val=\"center\"/>"
        "<w:spacing w:before=\"40\" w:after=\"0\"/></w:pPr>"
        f"{run_xml(text, italic=True, size=20)}"
        "</w:p>"
    )


def png_dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        signature = stream.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Not a PNG file: {path}")
        length = struct.unpack(">I", stream.read(4))[0]
        chunk_type = stream.read(4)
        if length < 8 or chunk_type != b"IHDR":
            raise ValueError(f"PNG has no valid IHDR chunk: {path}")
        width, height = struct.unpack(">II", stream.read(8))
    return width, height


def image_paragraph(
    *,
    relationship_id: str,
    document_property_id: int,
    name: str,
    description: str,
    image_path: Path,
    width_inches: float,
) -> str:
    pixel_width, pixel_height = png_dimensions(image_path)
    emu_per_inch = 914400
    width_emu = int(width_inches * emu_per_inch)
    height_emu = int(width_emu * pixel_height / pixel_width)
    safe_name = escape(name, quote=True)
    safe_description = escape(description, quote=True)
    return f"""
<w:p>
  <w:pPr>
    <w:jc w:val="center"/>
    <w:spacing w:before="0" w:after="0"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
    </w:rPr>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{width_emu}" cy="{height_emu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="{document_property_id}" name="{safe_name}" descr="{safe_description}"/>
        <wp:cNvGraphicFramePr>
          <a:graphicFrameLocks noChangeAspect="1"/>
        </wp:cNvGraphicFramePr>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="0" name="{safe_name}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{relationship_id}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:off x="0" y="0"/>
                  <a:ext cx="{width_emu}" cy="{height_emu}"/>
                </a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
"""


def section_properties(
    *,
    landscape: bool,
    margin_twips: int,
    next_page: bool,
) -> str:
    if landscape:
        page_size = '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>'
    else:
        page_size = '<w:pgSz w:w="12240" w:h="15840"/>'
    section_type = '<w:type w:val="nextPage"/>' if next_page else ""
    return (
        "<w:sectPr>"
        f"{section_type}{page_size}"
        f'<w:pgMar w:top="{margin_twips}" w:right="{margin_twips}" '
        f'w:bottom="{margin_twips}" w:left="{margin_twips}" '
        'w:header="720" w:footer="720" w:gutter="0"/>'
        '<w:cols w:space="720"/>'
        '<w:docGrid w:linePitch="360"/>'
        "</w:sectPr>"
    )


def section_break(*, landscape: bool, margin_twips: int) -> str:
    properties = section_properties(
        landscape=landscape,
        margin_twips=margin_twips,
        next_page=True,
    )
    return f"<w:p><w:pPr>{properties}</w:pPr></w:p>"


def build_document_xml() -> str:
    paragraphs: list[str] = [
        paragraph_xml(
            [run_xml("Mentor Market Assignment", bold=True)],
            style="Title",
        ),
        heading("Question 1: Functional and Non-Functional Requirements", 1),
        body(
            "Mentor Market uses the term tutor for the teacher role. Functional "
            "requirements describe the services provided by the system, while "
            "non-functional requirements describe the properties and constraints "
            "under which those services operate."
        ),
        heading("Functional Requirements", 2),
    ]

    for feature, requirements in FUNCTIONAL_REQUIREMENTS:
        paragraphs.append(heading(feature, 3))
        paragraphs.extend(requirement(label, text) for label, text in requirements)

    paragraphs.extend(
        [
            heading("Non-Functional Requirements", 2),
            body(
                "The following requirements apply across all six selected "
                "features."
            ),
        ]
    )
    for category, requirements in NON_FUNCTIONAL_REQUIREMENTS:
        paragraphs.append(heading(category, 3))
        paragraphs.extend(requirement(label, text) for label, text in requirements)

    # End the portrait Q1 section and begin Q2 on a dedicated landscape page.
    paragraphs.append(section_break(landscape=False, margin_twips=1440))
    paragraphs.extend(
        [
            heading("Question 2: UML Class Diagram", 1),
            image_paragraph(
                relationship_id="rId3",
                document_property_id=1,
                name="Mentor Market UML Class Diagram",
                description=(
                    "UML class diagram rendered from the editable Mentor Market "
                    "Draw.io source."
                ),
                image_path=CLASS_PNG,
                width_inches=9.0,
            ),
            caption(
                "Figure 1: Mentor Market UML class diagram rendered from the "
                "editable Draw.io source."
            ),
        ]
    )

    # End the landscape Q2 section and return to portrait for the written Q3 answer.
    paragraphs.append(section_break(landscape=True, margin_twips=288))
    paragraphs.append(heading("Question 3: Architecture Selection", 1))
    paragraphs.extend(body(text) for text in Q3_PARAGRAPHS)
    paragraphs.append(heading("Benefits of MVC for Mentor Market", 2))
    paragraphs.extend(bullet(text) for text in MVC_BENEFITS)
    paragraphs.append(body(Q3_CONCLUSION))
    paragraphs.append(heading("Alternative Architecture: Layered Architecture", 2))
    paragraphs.extend(body(text) for text in ALTERNATIVE_PARAGRAPHS)

    # End the portrait Q3 prose and place the architecture diagram on a clear
    # landscape page so its labels remain readable.
    paragraphs.append(section_break(landscape=False, margin_twips=1440))
    paragraphs.extend(
        [
            heading("Mentor Market MVC Architecture and Request Flow", 1),
            image_paragraph(
                relationship_id="rId4",
                document_property_id=2,
                name="Mentor Market MVC Architecture",
                description=(
                    "MVC request flow from users through the React View, Express "
                    "routes and controllers, data-access models, and MySQL."
                ),
                image_path=MVC_PNG,
                width_inches=9.7,
            ),
            caption(
                "Figure 2: Mentor Market MVC architecture and request flow."
            ),
        ]
    )
    final_section = section_properties(
        landscape=True,
        margin_twips=936,
        next_page=False,
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/'
        'wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/'
        'relationships" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/'
        'wordprocessingDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        f"<w:body>{''.join(paragraphs)}{final_section}</w:body>"
        "</w:document>"
    )


def build_styles_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
        <w:widowControl/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
      <w:widowControl/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:jc w:val="center"/>
      <w:spacing w:after="240" w:line="276" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="240" w:after="120"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="180" w:after="80"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="120" w:after="40"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>
"""


def build_settings_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode"
      w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>
"""


def write_docx() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    render_all()
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""
    root_relationships = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""
    document_relationships = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/mentor_market_class_diagram.png"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/mentor_market_mvc_architecture.png"/>
</Relationships>
"""
    core_properties = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Mentor Market Assignment - Questions 1, 2, and 3</dc:title>
  <dc:subject>Requirements, UML class diagram, and architecture selection</dc:subject>
  <dc:creator>Mentor Market</dc:creator>
  <cp:lastModifiedBy>Mentor Market</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:modified>
</cp:coreProperties>
"""
    app_properties = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
  <AppVersion>16.0000</AppVersion>
</Properties>
"""

    parts = {
        "[Content_Types].xml": content_types,
        "_rels/.rels": root_relationships,
        "word/document.xml": build_document_xml(),
        "word/styles.xml": build_styles_xml(),
        "word/settings.xml": build_settings_xml(),
        "word/_rels/document.xml.rels": document_relationships,
        "word/media/mentor_market_class_diagram.png": CLASS_PNG.read_bytes(),
        "word/media/mentor_market_mvc_architecture.png": MVC_PNG.read_bytes(),
        "docProps/core.xml": core_properties,
        "docProps/app.xml": app_properties,
    }

    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
        for path, content in parts.items():
            payload = content if isinstance(content, bytes) else content.encode("utf-8")
            archive.writestr(path, payload)

    print(OUTPUT)


if __name__ == "__main__":
    write_docx()
