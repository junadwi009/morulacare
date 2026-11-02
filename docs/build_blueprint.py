"""Generate the reviewable PDF from BLUEPRINT.md. Requires reportlab + Pillow.

Run from any directory: python docs/build_blueprint.py /absolute/output.pdf
Includes a vector diagram for the proposed release workflow.
"""
from pathlib import Path
import sys
import re
from html import escape

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    PageBreak, Table, TableStyle, Image, KeepTogether, Flowable,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'Morula_Care_Blueprint.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONT_ROOT = Path('/usr/share/fonts/truetype/dejavu')
if not FONT_ROOT.exists():
    raise SystemExit('Install DejaVu Sans fonts or update FONT_ROOT in this renderer.')
for name, filename in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Italic','DejaVuSans-Oblique.ttf'),('Mono','DejaVuSansMono.ttf')]:
    font_path = FONT_ROOT / filename
    if not font_path.exists():
        font_path = FONT_ROOT / 'DejaVuSans.ttf'
    pdfmetrics.registerFont(TTFont(name, str(font_path)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Italic', boldItalic='Bold')

INK = colors.HexColor('#34252F')
MUTED = colors.HexColor('#746C70')
ACCENT = colors.HexColor('#D66848')
PEACH = colors.HexColor('#FFF1E9')
LINE = colors.HexColor('#E6DEDA')
W,H = A4
WIDTH = W - 100

styles = {
    'body': ParagraphStyle('body', fontName='Body', fontSize=9.4, leading=15.0, textColor=INK, spaceAfter=8, splitLongWords=True),
    'h2': ParagraphStyle('h2', fontName='Bold', fontSize=18.0, leading=24, textColor=INK, spaceBefore=20, spaceAfter=12, keepWithNext=True),
    'h3': ParagraphStyle('h3', fontName='Bold', fontSize=11.6, leading=17, textColor=INK, spaceBefore=12, spaceAfter=7, keepWithNext=True),
    'table': ParagraphStyle('table', fontName='Body', fontSize=8.0, leading=12.3, textColor=INK, spaceAfter=0, splitLongWords=True),
    'th': ParagraphStyle('th', fontName='Bold', fontSize=8.0, leading=12.2, textColor=INK, spaceAfter=0),
    'small': ParagraphStyle('small', fontName='Body', fontSize=8.1, leading=12.8, textColor=MUTED, spaceAfter=8),
    'bullet': ParagraphStyle('bullet', fontName='Body', fontSize=9.4, leading=15, leftIndent=13, firstLineIndent=-10, textColor=INK, spaceAfter=6),
    'caption': ParagraphStyle('caption', fontName='Bold', fontSize=9, leading=14, textColor=ACCENT, spaceAfter=9),
    'cover_title': ParagraphStyle('cover_title', fontName='Bold', fontSize=42, leading=48, textColor=INK, spaceAfter=20),
    'cover_sub': ParagraphStyle('cover_sub', fontName='Body', fontSize=18, leading=27, textColor=INK, spaceAfter=20),
}

def clean(s):
    return s.replace('\u2011','-').replace('\u2013','-').replace('\u2014','-').replace('\u00a0',' ')

def inline(s):
    s = clean(s)
    # References retain clickable canonical URLs while long URLs wrap safely.
    s = escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`([^`]+)`', r'<font name="Mono" size="8.4">\1</font>', s)
    s = re.sub(r'(https?://[^\s<]+)', lambda m: '<link href="'+m.group(1)+'" color="#A64C33">'+m.group(1)+'</link>', s)
    return s

class BlueprintDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=50, rightMargin=50,
            topMargin=53, bottomMargin=50, title='Morula Care | Product Blueprint',
            author='Prepared for Arjuna', subject='Fertility patient app: product flow and technical foundation')
        frame = Frame(50, 50, WIDTH, H-103, leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0, id='body')
        self.addPageTemplates(PageTemplate(id='normal', frames=[frame], onPage=self.decorate))
        self.section = ''
    def decorate(self, c, doc):
        c.saveState()
        if doc.page == 1:
            c.setFillColor(PEACH); c.rect(0,0,W,H,fill=1,stroke=0)
            c.setFillColor(ACCENT); c.rect(50,H-78,58,5,fill=1,stroke=0)
            c.setStrokeColor(colors.HexColor('#E9B6A2')); c.setLineWidth(1)
            for dx,dy,r in [(500,155,140),(535,215,100),(450,210,45)]:
                c.circle(dx,dy,r,stroke=1,fill=0)
        else:
            c.setFont('Bold',8); c.setFillColor(ACCENT); c.drawString(50,H-31,'MORULA CARE')
            c.setFont('Body',7.5); c.setFillColor(MUTED); c.drawRightString(W-50,H-31,'PRODUCT BLUEPRINT / 0.1')
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(50,39,W-50,39)
            c.setFont('Body',7); c.drawString(50,26,'31 Oktober 2026  |  Konsep dan data sintetis')
            c.drawRightString(W-50,26,str(doc.page))
        c.restoreState()
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'h2':
            label = flowable.getPlainText()
            if re.match(r'^\d+\.',label):
                key='sec-'+label.split('.')[0]
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(label,key,level=0)
                self.notify('TOCEntry',(0,label,self.page,key))

class ReleaseFlow(Flowable):
    def __init__(self):
        super().__init__(); self.width=WIDTH; self.height=520
    def draw(self):
        c=self.canv
        def box(x,y,w,lines,fill=colors.white):
            c.setFillColor(fill);c.setStrokeColor(LINE);c.setLineWidth(.7)
            c.roundRect(x-w/2,y-28,w,56,10,fill=1,stroke=1)
            c.setFillColor(INK)
            for i,line in enumerate(lines):
                c.setFont('Bold' if i==0 else 'Body',9.3 if i==0 else 8)
                c.drawCentredString(x,y+7-i*15,line)
        def arrow(points,label=None,labelpos=None):
            c.setStrokeColor(MUTED);c.setFillColor(MUTED);c.setLineWidth(1)
            p=c.beginPath();p.moveTo(*points[0])
            for q in points[1:]:p.lineTo(*q)
            c.drawPath(p)
            x,y=points[-1];px,py=points[-2]
            import math
            a=math.atan2(y-py,x-px);r=5
            p=c.beginPath();p.moveTo(x,y);p.lineTo(x-r*math.cos(a-.5),y-r*math.sin(a-.5));p.lineTo(x-r*math.cos(a+.5),y-r*math.sin(a+.5));p.close();c.drawPath(p,fill=1,stroke=0)
            if label:
                c.setFont('Body',8);c.drawCentredString(*labelpos,label)
        center=WIDTH/2;left=116;right=WIDTH-116
        box(center,470,265,['Sumber rumah sakit','RME, appointment, dan laboratorium'],PEACH)
        box(center,375,265,['Cocokkan identitas dan versi','Pasien, episode, objek, waktu, dan sumber'])
        box(center,280,265,['Periksa kewenangan rilis','Hanya informasi yang disetujui untuk pasien'],PEACH)
        box(left,170,205,['Antrean petugas','Verifikasi, koreksi, atau penjelasan'])
        box(right,170,205,['Snapshot pasien','Isi dan versi yang boleh diakses'])
        box(left,60,205,['Perbaiki atau sahkan','Jejak perubahan tetap tersimpan'])
        box(right,60,205,['Aplikasi dan notifikasi','Akses terotorisasi; pesan layar netral'])
        arrow([(center,442),(center,403)])
        arrow([(center,347),(center,308)])
        arrow([(center,252),(center,229),(left,229),(left,198)],'Perlu tindak lanjut',(left+52,211))
        arrow([(center,252),(center,229),(right,229),(right,198)],'Dirilis',(right+32,211))
        arrow([(left,142),(left,88)])
        arrow([(right,142),(right,88)])
        arrow([(left-102.5,60),(3,60),(3,375),(center-132.5,375)])

def table(lines):
    rows=[]
    for i,line in enumerate(lines):
        cells=[cell.strip() for cell in line.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-+:?',c or '-') for c in cells):
            continue
        sty=styles['th'] if not rows else styles['table']
        rows.append([Paragraph(inline(c),sty) for c in cells])
    n=len(rows[0])
    fractions={2:[.30,.70],3:[.24,.42,.34],4:[.23,.29,.34,.14]}.get(n,[1/n]*n)
    tbl=Table(rows,colWidths=[WIDTH*f for f in fractions],repeatRows=1,hAlign='LEFT')
    tbl.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),PEACH),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LINEBELOW',(0,0),(-1,0),.8,colors.HexColor('#E9C8B8')),
        ('LINEBELOW',(0,1),(-1,-1),.4,LINE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#FCFAF9')]),
    ]))
    return tbl

story=[
    Spacer(1,112),
    Paragraph('PATIENT EXPERIENCE / FERTILITY CARE',styles['caption']),
    Paragraph('Morula<br/>Care',styles['cover_title']),
    Paragraph('Flow pasien, fitur, dan<br/>fondasi aplikasi mobile',styles['cover_sub']),
    Paragraph('Android + iOS<br/>React Native + Java Spring Boot',styles['body']),
    Spacer(1,32),
    Paragraph('Rancangan untuk diskusi produk, tim klinik, dan engineering. Memuat keputusan desain, alur klinis, batas chatbot, integrasi, prioritas implementasi, dan kriteria pilot.',styles['body']),
    Spacer(1,34),
    Paragraph('<b>Versi 0.1 / 31 Oktober 2026</b><br/>Disiapkan untuk Arjuna<br/>Konsep kerja. Seluruh contoh pasien adalah sintetis.',styles['small']),
    PageBreak(),
    Paragraph('Daftar isi',styles['h2']),
]
toc=TableOfContents()
toc.levelStyles=[ParagraphStyle('toc',fontName='Body',fontSize=9.1,leading=14.5,textColor=INK,spaceBefore=1,leftIndent=0,firstLineIndent=0)]
story += [toc, PageBreak()]

story += [Paragraph('Alur rilis informasi',styles['h2']), Paragraph('Rancangan target untuk memastikan informasi yang diterima pasien memiliki identitas, sumber, dan kewenangan rilis yang jelas. Proses staf serta integrasi sumber nyata belum aktif pada demo.',styles['body']), ReleaseFlow(), Spacer(1,12), Paragraph('Perkembangan klinis mengikuti event yang disahkan. Aplikasi tidak menaikkan tahap embrio secara otomatis berdasarkan hari pada kalender.',styles['small']), PageBreak()]

lines=ROOT.joinpath('BLUEPRINT.md').read_text(encoding='utf-8').splitlines()
start=next(i for i,l in enumerate(lines) if l.startswith('## 1.'))
i=start
while i<len(lines):
    line=lines[i].strip()
    if not line:
        i+=1; continue
    if line.startswith('## '):
        story.append(Paragraph(inline(line[3:]),styles['h2'])); i+=1; continue
    if line.startswith('### '):
        story.append(Paragraph(inline(line[4:]),styles['h3'])); i+=1; continue
    if line.startswith('|'):
        batch=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            batch.append(lines[i]);i+=1
        story.extend([table(batch),Spacer(1,10)]);continue
    if line.startswith('- '):
        story.append(Paragraph('- '+inline(line[2:]),styles['bullet'])); i+=1;continue
    if re.match(r'^\d+\. ',line):
        story.append(Paragraph(inline(line),styles['bullet'])); i+=1;continue
    para=[line];i+=1
    while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||- |\d+\. )',lines[i].strip()):
        para.append(lines[i].strip());i+=1
    story.append(Paragraph(inline(' '.join(para)),styles['body']))

BlueprintDoc(str(OUT)).multiBuild(story)
print(str(OUT))
