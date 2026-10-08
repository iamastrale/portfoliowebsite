from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


OUT = Path("output/pdf/TrevorHiguera-SoundDesigner-Keywords.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = letter
NAVY = HexColor("#14242E")
INK = HexColor("#202B33")
MUTED = HexColor("#67747C")
LIGHT = HexColor("#EEF4F3")
LINE = HexColor("#C9D8D7")
CYAN = HexColor("#35AEB4")
WHITE = HexColor("#FFFFFF")


def style(name, size, leading, color=INK, font="Helvetica", **kwargs):
    return ParagraphStyle(
        name,
        fontName=font,
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
        **kwargs,
    )


BODY = style("body", 9.5, 12.8, MUTED)
BULLET = style("bullet", 9.35, 12.6, MUTED)
ROLE = style("role", 12.3, 15.0, INK, "Helvetica-Bold")
DATE = style("date", 8.5, 10.5, CYAN, "Helvetica-Bold")
SIDEBAR = style("sidebar", 8.85, 12.2, MUTED)
SIDEBAR_BOLD = style("sidebar-bold", 9.5, 12.0, INK, "Helvetica-Bold")


def paragraph(c, text, x, y_top, width, pstyle, max_height=200):
    p = Paragraph(text, pstyle)
    _, height = p.wrap(width, max_height)
    p.drawOn(c, x, y_top - height)
    return y_top - height


def label(c, text, x, y, width=None):
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x, y, text.upper())
    if width:
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(x + stringWidth(text.upper(), "Helvetica-Bold", 9) + 9, y + 2.2, x + width, y + 2.2)


def bullet(c, text, x, y, width):
    c.setFillColor(CYAN)
    c.circle(x + 3, y - 4.4, 1.15, stroke=0, fill=1)
    return paragraph(c, text, x + 10, y, width - 10, BULLET)


def role_block(c, company, company_url, role, dates, bullets, x, y, width):
    linked = f"<link href='{company_url}' color='#202B33'><u>{company}</u></link>"
    y = paragraph(c, f"{linked} <font color='#8B969C'>|</font> {role}", x, y, width, ROLE)
    y -= 1.5
    y = paragraph(c, dates.upper(), x, y, width, DATE)
    y -= 5
    for item in bullets:
        y = bullet(c, item, x, y, width)
        y -= 8
    return y - 25


c = canvas.Canvas(str(OUT), pagesize=letter, pageCompression=1)
c.setTitle("Trevor Higuera - Lead Sound Designer")
c.setAuthor("Trevor Higuera")
c.setSubject("Sound design, technical audio, and interactive music resume")
c.setKeywords("lead sound designer, music producer, game audio, UI UX audio, audio engineering, music composer, interactive music, adaptive music, Wwise, FMOD, Unreal Engine 5, Unity, Blueprints, MetaSounds, RTPCs, States, Switches, spatial audio, sound effects, SFX, field recording, synthesis, mixing, mastering, implementation, profiling, optimization")

# Header
c.setFillColor(NAVY)
c.rect(0, PAGE_H - 137, PAGE_W, 137, stroke=0, fill=1)
c.setFillColor(CYAN)
c.rect(0, PAGE_H - 141, PAGE_W, 4, stroke=0, fill=1)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 31)
c.drawString(36, PAGE_H - 55, "TREVOR HIGUERA")
c.setFillColor(HexColor("#BCE9E7"))
c.setFont("Helvetica-Bold", 10)
c.drawString(37, PAGE_H - 77, "LEAD SOUND DESIGNER  |  MUSIC PRODUCER  |  COMPOSER  |  AUDIO ENGINEER")

contact_label_y = PAGE_H - 101
contact_y = PAGE_H - 117
contacts = [
    ("WEBSITE", "astrale.one", "https://astrale.one/", 37),
    ("EMAIL", "astraleofficial@gmail.com", "mailto:astraleofficial@gmail.com", 205),
    ("LINKEDIN", "linkedin.com/in/trevorhiguera", "https://www.linkedin.com/in/trevorhiguera/", 390),
]
for field, text, url, cx in contacts:
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 7.1)
    c.drawString(cx, contact_label_y, field)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8.5)
    c.drawString(cx, contact_y, text)
    tw = stringWidth(text, "Helvetica", 8.5)
    c.linkURL(url, (cx, contact_y - 2, cx + tw, contact_y + 9), relative=0)

# Main resume content
left = 36
content_w = PAGE_W - 72
y = PAGE_H - 172

# Two-column body
main_x = left
main_w = 365
side_x = 426
side_w = 150

label(c, "Experience", main_x, y, main_w)
y -= 17
y = role_block(
    c,
    "GOOD1 Studios",
    "https://www.good1studios.com/",
    "Lead Sound Designer / Composer (Full-time)",
    "Sep 2021 - Present",
    [
        "Lead end-to-end audio for <i>Deadline Delivery</i> and <i>CODE RED</i> within a six-person remote studio, owning audio direction, sound design, UI/UX audio, music composition, implementation, mix, QA, and delivery.",
        "Designed, edited, processed, and implemented <b>1,000+ SFX</b> across vehicles, gameplay feedback, UI, Foley, ambience, and environments using field recording, synthesis, layering, and asset optimization.",
        "Built and debugged interactive Wwise and Unreal Engine 5 systems using Events, RTPCs, States, Switches, containers, and Blueprints; profiled runtime behavior and resolved implementation issues.",
        "Composed, arranged, produced, mixed, and mastered original scores and adaptive music stems, collaborating with design and engineering to support pacing, player feedback, and the overall user experience.",
    ],
    main_x,
    y,
    main_w,
)

y = role_block(
    c,
    "What Is This Studio Ltd.",
    "https://www.wits.academy/",
    "Sound Designer (Contract)",
    "Jul 2024 - Oct 2024",
    [
        "Established the end-to-end Unity (C#) and Wwise pipeline for <i>What Is This Sorcery</i>, including event mapping, bank architecture, and Addressables.",
        "Designed and implemented the game's sound and music systems from the ground up; improved the C# integration workflow and <b>reduced integration time by 30%</b>.",
    ],
    main_x,
    y,
    main_w,
)

y = role_block(
    c,
    "Riot Games",
    "https://www.riotgames.com/en",
    "Music Producer (Contract)",
    "Jun 2023 - Sep 2023",
    [
        "Produced, edited, and delivered interactive music stems for <i>VALORANT</i> in-game environments, aligning musical transitions, arrangement, and final assets with creative and technical direction.",
    ],
    main_x,
    y,
    main_w,
)

y = role_block(
    c,
    "Artlist",
    "https://artlist.io/",
    "Music Producer (Contract)",
    "Apr 2022 - Mar 2023",
    [
        "Created release-ready catalog music for a sync-licensing platform partnered with brands including Adidas, Nike, IKEA, Netflix, and Adobe.",
        "Collaborated with artist-management teams and released multiple tracks through the Artlist catalog.",
    ],
    main_x,
    y,
    main_w,
)

# Sidebar
side_top = PAGE_H - 192
c.setFillColor(HexColor("#F5F8F7"))
sidebar_bottom = 105
c.roundRect(side_x - 12, sidebar_bottom, side_w + 24, side_top + 13 - sidebar_bottom, 8, stroke=0, fill=1)
sy = side_top
label(c, "Core Skills", side_x, sy, side_w)
sy -= 18

skill_groups = [
    ("SOUND DESIGN", "Gameplay SFX, UI/UX audio, Foley, ambience, field recording, synthesis, layering, editing, asset preparation"),
    ("TECHNICAL AUDIO", "Wwise, FMOD, Unreal Engine 5, Unity, Blueprints, MetaSounds, C#, Events, RTPCs, States, Switches, spatial audio, profiling and optimization"),
    ("MUSIC + ENGINEERING", "Composition, arrangement, adaptive music, stems, music editing, recording, signal processing, mixing and mastering"),
    ("TOOLS + WORKFLOW", "Pro Tools, Ableton Live, FL Studio, Reaper, Cubase, Git, Perforce, audio QA, debugging, cross-discipline collaboration"),
]
for heading, text in skill_groups:
    sy = paragraph(c, heading, side_x, sy, side_w, SIDEBAR_BOLD)
    sy -= 5
    sy = paragraph(c, text, side_x, sy, side_w, SIDEBAR)
    sy -= 35

label(c, "Education", side_x, sy, side_w)
sy -= 18
sy = paragraph(c, "National University", side_x, sy, side_w, SIDEBAR_BOLD)
sy -= 5
sy = paragraph(c, "Bachelor of Arts in Digital Media Design<br/><font size='7'>Expected March 2027</font>", side_x, sy, side_w, SIDEBAR)

c.showPage()
c.save()
print(OUT.resolve())
