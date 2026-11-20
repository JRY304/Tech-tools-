import json, sys, os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
cfg=json.load(open(sys.argv[1])); meta=json.load(open(cfg.get('meta','meta.json'))); OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
W,H=1080,1920; BG=(14,14,16); FG=(240,238,232); MUTED=(150,148,142)
F='/usr/share/fonts/opentype/inter/'
f=lambda w,s: ImageFont.truetype(F+{'b':'Inter-Bold.otf','x':'Inter-ExtraBold.otf','r':'Inter-Regular.otf','s':'Inter-SemiBold.otf','k':'InterDisplay-Black.otf'}[w],s)
def crop(key,w,h,fx=.5,fy=.35,zoom=1.0):
    im=Image.open(f'dl/full/{key}.jpg').convert('RGB'); iw,ih=im.size
    s=max(w/iw,h/ih)*zoom; im=im.resize((round(iw*s),round(ih*s)),Image.LANCZOS); iw,ih=im.size
    x=min(max(round(fx*iw-w/2),0),iw-w); y=min(max(round(fy*ih-h/2),0),ih-h)
    return im.crop((x,y,x+w,y+h))
def tile(canvas,p,x,y,w,h):
    im=crop(p['key'],w,h,p.get('fx',.5),p.get('fy',.35),p.get('zoom',1.0))
    if p.get('mono'): im=im.convert('L').convert('RGB')
    canvas.paste(im,(x,y))
    g=Image.new('L',(1,256)); [g.putpixel((0,i),int(235*max(0,(i-110)/146)**1.4)) for i in range(256)]
    g=g.resize((w,260)); canvas.paste((0,0,0),(x,y+h-260),g)
    d=ImageDraw.Draw(canvas)
    d.text((x+22,y+h-104),p['name'],font=f('x',40),fill=FG)
    d.text((x+22,y+h-54),p['role'],font=f('s',27),fill=(205,203,196))
def section_label(d,y,text,color,sub):
    d.rectangle([30,y,38,y+44],fill=color)
    d.text((54,y-2),text,font=f('k',44),fill=FG)
    tw=d.textlength(text,font=f('k',44)); d.text((54+tw+18,y+12),sub,font=f('s',26),fill=MUTED)
def slide(s,i,n):
    c=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(c)
    d.text((30,48),s.get('header',cfg.get('header','THE FACE OF POWER')),font=f('x',30),fill=MUTED)
    t=f'{i}/{n}'; d.text((W-30-d.textlength(t,font=f('s',30)),48),t,font=f('s',30),fill=MUTED)
    PH=700; PW=(W-30*2-20)//2
    section_label(d,130,s.get('top_label','USA'),(214,40,40),s.get('top_sub','2026'))
    for j,p in enumerate(s['top']): tile(c,p,30+j*(PW+20),196,PW,PH)
    d.text((W/2,955),'vs.',font=f('k',58),fill=FG,anchor='mm')
    section_label(d,1000,s['bottom_label'],tuple(s['bottom_color']),s['bottom_sub'])
    for j,p in enumerate(s['bottom']): tile(c,p,30+j*(PW+20),1066,PW,PH)
    d.text((30,1806),s.get('caption',''),font=f('s',30),fill=FG)
    d.text((30,1860),'Photos: Wikimedia Commons. Credits at end.',font=f('r',22),fill=MUTED)
    return c
def wrap(d,text,font,maxw):
    out=[];line=''
    for w in text.split():
        t=(line+' '+w).strip()
        if d.textlength(t,font=font)>maxw and line: out.append(line); line=w
        else: line=t
    return out+[line]
def title():
    c=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(c)
    d.rectangle([60,700,72,1010],fill=(214,40,40))
    for k,l in enumerate(cfg['title']): d.text((100,690+k*110),l,font=f('k',104),fill=FG)
    y=1060
    for l in wrap(d,cfg['subtitle'],f('s',38),880): d.text((100,y),l,font=f('s',38),fill=MUTED); y+=52
    return c
def outro():
    c=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(c); y=640
    for l in cfg['outro']: d.text((W/2,y),l,font=f('k',80),fill=FG,anchor='mm'); y+=100
    return c
def credits():
    c=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(c)
    d.text((60,110),'Photo credits',font=f('k',56),fill=FG)
    d.text((60,185),'Wikimedia Commons, licenses as listed. Photos chosen to make the point.',font=f('r',24),fill=MUTED)
    y=260; names={p['key']:p['name'] for s in cfg['slides'] for p in s['top']+s['bottom']}
    for k,nm in names.items():
        m=meta[k]; line=f"{nm}: {m['author'] or 'unknown'} ({m['license']})"
        for l in wrap(d,line,f('r',25),960): d.text((60,y),l,font=f('r',25),fill=FG); y+=34
        y+=10
    return c
frames=[title()]+[slide(s,i+1,len(cfg['slides'])) for i,s in enumerate(cfg['slides'])]+[outro(),credits()]
durs=[3.2]+[cfg.get('slide_secs',4.5)]*len(cfg['slides'])+[3.0,4.0]
for i,fr in enumerate(frames): fr.save(f'{OUT}/frame_{i:02d}.png')
# video: gentle push-in per frame, crossfades
fps=30; X=0.5; inputs=[]; fl=[]
for i,dur in enumerate(durs):
    inputs+=['-framerate',str(fps),'-loop','1','-t',str(dur),'-i',f'{OUT}/frame_{i:02d}.png']
    nf=int(dur*fps)
    fl.append(f"[{i}:v]scale=2160:3840,zoompan=z='1+0.035*on/{nf}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={fps},setsar=1,format=yuv420p[v{i}]")
prev='v0'; off=0
for i in range(1,len(durs)):
    off+=durs[i-1]-X; fl.append(f"[{prev}][v{i}]xfade=transition=fade:duration={X}:offset={off:.2f}[x{i}]"); prev=f'x{i}'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',*inputs,'-filter_complex',';'.join(fl),'-map',f'[{prev}]','-c:v','libx264','-crf','20','-preset','medium','-movflags','+faststart',cfg['video']],check=True)
print('done',cfg['video'])
