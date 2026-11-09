from pathlib import Path
from html import escape
import runpy,re,textwrap
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Preformatted,Table,TableStyle,PageBreak
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=Path(__file__).resolve().parents[1]
model=runpy.run_path(str(root/'docs/live_guide_model.py'))
blocks=model['blocks']
for font,file in [('Body','arial.ttf'),('BodyBold','arialbd.ttf'),('Code','consola.ttf')]:pdfmetrics.registerFont(TTFont(font,str(Path('C:/Windows/Fonts')/file)))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='GuideBody',fontName='Body',fontSize=10,leading=14,spaceAfter=8,textColor=colors.HexColor('#203b49')))
styles.add(ParagraphStyle(name='GuideHeading',fontName='BodyBold',fontSize=16,leading=20,spaceBefore=16,spaceAfter=9,keepWithNext=True,textColor=colors.HexColor('#145568')))
styles.add(ParagraphStyle(name='GuideTitle',fontName='BodyBold',fontSize=25,leading=29,spaceAfter=16,textColor=colors.HexColor('#173b49')))
styles.add(ParagraphStyle(name='GuideCode',fontName='Code',fontSize=7.4,leading=10,spaceBefore=7,spaceAfter=12,leftIndent=10,rightIndent=8,backColor=colors.HexColor('#f2f5f4')))
styles.add(ParagraphStyle(name='GuideCell',fontName='Body',fontSize=8.5,leading=12,spaceAfter=2))
styles.add(ParagraphStyle(name='GuideBullet',parent=styles['GuideBody'],leftIndent=14,firstLineIndent=0,bulletIndent=0))
def para(s,style='GuideBody'):
 s=s.replace('\u2011','-').replace('\u2013','-').replace('\u2014','-')
 html=escape(s)
 html=re.sub(r'(https?://[^\s<]+)',lambda m:f'<a href="{m.group(1)}" color="#145568">{m.group(1)}</a>',html)
 return Paragraph(html,styles[style])
def page(canvas,doc):
 canvas.saveState();canvas.setFont('Body',8);canvas.setFillColor(colors.HexColor('#54707a'));canvas.drawString(44,815,'CPS 5745 | Unit 12 | Corrected all-eight beginner edition');canvas.line(44,806,551,806);canvas.drawString(44,26,'Runnable source: accompanying workspace + copyable HTML assignment');canvas.drawRightString(551,26,str(doc.page));canvas.restoreState()
output=root/'output/pdf';output.mkdir(parents=True,exist_ok=True)
story=[]
for i,(kind,value) in enumerate(blocks):
 if kind=='h':
  if value.startswith('6. Mini-lab'):story.append(PageBreak())
  story.append(para(value,'GuideTitle' if i==0 else 'GuideHeading'))
 elif kind=='p':story.append(para(value))
 elif kind=='ul':
  for item in value:story.append(Paragraph(escape(item),styles['GuideBullet'],bulletText='-'))
 elif kind=='code':
  lines=[]
  for line in value.splitlines():
   if len(line)<=105:lines.append(line)
   else:lines.extend(textwrap.wrap(line,width=105,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False,subsequent_indent='    '))
  story.append(Preformatted('\n'.join(lines),styles['GuideCode']))
 elif kind=='table':
  n=len(value[0]);widths=[507/n]*n
  if n==2:widths=[190,317]
  if n==3:widths=[124,217,166]
  cells=[[para(str(x),'GuideCell') for x in row] for row in value]
  t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e3eeec')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#d8e1df')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.extend([t,Spacer(1,10)])
SimpleDocTemplate(str(output/'Unit12_Corrected_Beginner_Guide.pdf'),pagesize=(595.28,841.89),leftMargin=44,rightMargin=44,topMargin=48,bottomMargin=46,title='CPS 5745 Unit 12 - Corrected Beginner Guide',author='Julie Kumar - CPS 5745').build(story,onFirstPage=page,onLaterPages=page)
# HTML and Markdown use the same lesson text. HTML embeds all actual source files.
html_parts=[];md=[];headings=[]
for i,(kind,value) in enumerate(blocks):
 if kind=='h':
  tag='h1' if i==0 else 'h2';html_parts.append(f'<{tag} id="section-{i}">{escape(value)}</{tag}>');md.append(('# ' if i==0 else '## ')+value);headings.append((i,value))
 elif kind=='p':html_parts.append('<p>'+escape(value)+'</p>');md.append(value)
 elif kind=='ul':html_parts.append('<ul>'+''.join('<li>'+escape(x)+'</li>' for x in value)+'</ul>');md.extend('- '+x for x in value)
 elif kind=='code':html_parts.append('<div class="source-code"><button class="copy">Copy code</button><pre><code>'+escape(value)+'</code></pre></div>');md.append('```javascript\n'+value+'\n```')
 elif kind=='table':html_parts.append('<div class="table-wrap"><table>'+''.join('<tr>'+''.join(f'<{"th" if j==0 else "td"}>'+escape(str(x))+f'</{"th" if j==0 else "td"}>' for x in row)+'</tr>' for j,row in enumerate(value))+'</table></div>');md.append('| '+' | '.join(value[0])+' |\n|'+' --- |'*len(value[0])+'\n'+'\n'.join('| '+' | '.join(str(x) for x in row)+' |' for row in value[1:]))
source_files=sorted(set([*root.glob('apps/*/src/main.*'),*root.glob('apps/*/src/App.*'),*root.glob('apps/*/vite.config.js'),*root.glob('shared/*'),*root.glob('shared/experiences/*.js'),root/'scripts/vite-common.mjs',root/'scripts/providers.mjs']))
html_parts.append('<h2 id="all-source">Full copyable source files</h2><p>The blocks below are read directly from the runnable workspace. Keep their exact paths and bootstrap/config imports. The shared files are copied into every src/shared folder by npm run sync.</p>')
for f in source_files:
 if f.suffix not in ['.js','.jsx','.vue','.svelte','.mjs','.css']:continue
 path=f.relative_to(root).as_posix();html_parts.append('<details><summary>'+escape(path)+'</summary><div class="source-code"><button class="copy">Copy complete file</button><pre><code>'+escape(f.read_text(encoding='utf-8-sig'))+'</code></pre></div></details>')
css=(root/'shared/style.css').read_text(encoding='utf-8-sig')+'\n.article{max-width:1080px;margin:auto;padding:30px 25px}pre{background:#123844;color:#edf5f3;white-space:pre;overflow:auto;font:13px/1.6 Consolas,monospace}pre code{background:none;padding:0;color:inherit}.source-code{position:relative;margin:15px 0}.copy{margin:5px 0}h2{margin-top:35px}nav ol{columns:2}@media(max-width:650px){nav ol{columns:1}}@media print{.copy,nav{display:none}pre{white-space:pre-wrap;color:black;background:#eee}h2{break-after:avoid}}'
nav='<nav><h2>Contents</h2><ol>'+''.join(f'<li><a href="#section-{i}">{escape(v)}</a></li>' for i,v in headings if i>0 and not v.startswith('Corrected runnable source'))+'<li><a href="#all-source">Full source code</a></li></ol></nav>'
script="document.querySelectorAll('.copy').forEach(b=>b.onclick=async()=>{const code=b.parentElement.querySelector('code');try{await navigator.clipboard.writeText(code.textContent);b.textContent='Copied'}catch{const range=document.createRange();range.selectNodeContents(code);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);b.textContent='Selected: press Ctrl+C'}});"
(root/'docs/ASSIGNMENT.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CPS 5745 Unit 12 - Corrected beginner assignment</title><style>'+css+'</style></head><body><article class="article"><p><a href="http://127.0.0.1:5280">Back to eight-lab launcher</a></p>'+nav+''.join(html_parts)+'</article><script>'+script+'</script></body></html>',encoding='utf-8')
(root/'docs/ASSIGNMENT.md').write_text('\n\n'.join(md)+'\n',encoding='utf-8')
print('Created corrected PDF, copyable HTML assignment and Markdown source.')
