import json, os, subprocess, sys, numpy as np, wave
from PIL import Image, ImageDraw, ImageFont
S=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B=S+"/build"; SRC=S+"/src/in.mp4"; FONT=S+"/font/Heebo-900.ttf"
W,H,FPS=1080,1920,30
# (src_start, dur, kind)  kind: hero = slow zoom + glow
SEGS=[(2.0,1.7,"hero"),(3.7,1.5,"hero"),(5.7,1.4,""),(7.0,1.3,""),(9.3,2.0,""),(12.7,1.8,""),
      (15.0,1.6,""),(38.3,2.0,""),(40.6,1.9,""),(44.9,2.1,""),(47.0,1.4,"")]
END=1.0
starts=[];t=0
for s,d,k in SEGS: starts.append(t); t+=d
MAIN=t; TOTAL=MAIN+END
SR=44100
def wr(name,x):
    x=np.clip(x,-1,1); 
    with wave.open(name,"wb") as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        st=np.stack([x,x],1) if x.ndim==1 else x
        w.writeframes((st*32767).astype("<i2").tobytes())
rng=np.random.default_rng(7)
def env(n,a,r): 
    t=np.arange(n)/SR; return np.minimum(t/a,1)*np.exp(-t/r)
def whoosh(d=0.45):
    n=int(SR*d); x=rng.standard_normal(n); 
    # swept band-pass via cumulative filter: crude sweep using modulated sine-noise mix
    t=np.arange(n)/SR; f=300+4000*(t/d)**2
    ph=2*np.pi*np.cumsum(f)/SR
    y=x*0.5*np.sin(ph)+x*0.25
    e=np.sin(np.pi*np.clip(t/d,0,1))**1.5
    return y*e*0.5
def ding():
    n=int(SR*0.9); t=np.arange(n)/SR
    y=sum(a*np.sin(2*np.pi*f*t) for f,a in((1568,1),(2093,.6),(3136,.35)))
    return y*np.exp(-t*5)*0.35
def music(total):
    bpm=140; beat=60/bpm; n=int(SR*(total+1)); out=np.zeros(n)
    def put(x,at,g=1):
        i=int(at*SR); 
        if i>=n: return
        m=min(len(x),n-i); out[i:i+m]+=x[:m]*g
    def kick():
        k=int(SR*0.5); t=np.arange(k)/SR; f=45+110*np.exp(-t*28)
        return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)*1.0
    def snare():
        k=int(SR*0.25); t=np.arange(k)/SR
        return (rng.standard_normal(k)*np.exp(-t*22)*0.6+np.sin(2*np.pi*190*t)*np.exp(-t*30)*0.4)
    def hat(o=False):
        k=int(SR*(0.18 if o else 0.05)); t=np.arange(k)/SR
        x=np.diff(rng.standard_normal(k+1)); return x*np.exp(-t*(20 if o else 90))*0.35
    def b808(f,d):
        k=int(SR*d); t=np.arange(k)/SR
        y=np.tanh(2.2*np.sin(2*np.pi*f*t))*np.exp(-t*2.2)*np.minimum(t/0.005,1)
        return y*0.9
    def lead(f,d):
        k=int(SR*d); t=np.arange(k)/SR
        y=(np.sign(np.sin(2*np.pi*f*t))*0.5+np.sin(2*np.pi*f*2*t)*0.3)
        return y*np.exp(-t*6)*np.minimum(t/0.003,1)*0.25
    bars=int(total/(beat*4))+2
    bass=[55,55,65.4,49]; leadn=[440,523.3,392,349.2]
    for b in range(bars):
        t0=b*beat*4
        for q in (0,2.5,3): pass
        put(kick(),t0); put(kick(),t0+beat*2.5); put(kick(),t0+beat*3.25 if b%2 else t0+beat*1.75)
        put(snare(),t0+beat); put(snare(),t0+beat*3)
        for i in range(8): put(hat(i%4==3),t0+i*beat/2,0.8)
        if b%2: 
            for j in range(4): put(hat(),t0+beat*3.5+j*beat/8,0.8)
        put(b808(bass[b%4],beat*3.4),t0,0.8)
        for j,(o,f) in enumerate(((0,leadn[b%4]),(1.5,leadn[(b+1)%4]),(2.5,leadn[b%4]*1.5))):
            put(lead(f,beat*0.9),t0+o*beat,0.8)
    return out[:int(SR*total)]
def ensure_audio(whoosh_times,ding_times):
    m=music(TOTAL); wr(B+"/music.wav",m/ (np.abs(m).max()+1e-9)*0.9)
    fx=np.zeros(int(SR*TOTAL))
    wh=whoosh()
    for tt in whoosh_times:
        i=max(0,int((tt-0.3)*SR)); x=wh[:len(fx)-i]; fx[i:i+len(x)]+=x
    for tt in ding_times:
        i=int(tt*SR); d=ding(); x=d[:len(fx)-i]; fx[i:i+len(x)]+=x
    wr(B+"/fx.wav",fx)
def endcard():
    img=Image.new("RGB",(W,H),(10,10,14)); d=ImageDraw.Draw(img)
    for y in range(H):
        c=int(40*(1-abs(y-H/2)/(H/2))); d.line([(0,y),(W,y)],fill=(10+c,10+c//3,14+c))
    f=ImageFont.truetype(FONT,150)
    txt="רוצים עוד?"; txt2="עקבו"
    qf=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",150)
    def center(t,y,fill):
        q=t.endswith("?"); t=t.rstrip("?")
        bb=d.textbbox((0,0),t,font=f,direction="rtl",language="he",stroke_width=10)
        qw=(qf.getbbox("?",stroke_width=10)[2]+10) if q else 0
        x=(W-(bb[2]-bb[0])-qw)/2-bb[0]+qw
        if q:
            qx=x+bb[0]-qw
            d.text((qx+8,y+10),"?",font=qf,fill=(0,0,0),stroke_width=10,stroke_fill=(0,0,0))
            d.text((qx,y),"?",font=qf,fill=fill,stroke_width=10,stroke_fill=(0,0,0))
        d.text((x+8,y+10),t,font=f,fill=(0,0,0),direction="rtl",language="he",stroke_width=10,stroke_fill=(0,0,0))
        d.text((x,y),t,font=f,fill=fill,direction="rtl",language="he",stroke_width=10,stroke_fill=(0,0,0))
    center(txt,720,(255,255,255)); center(txt2,930,(255,214,0))
    d.rounded_rectangle([340,1190,740,1210],10,fill=(255,214,0))
    img.save(B+"/end.png")
def caption_png(i,words):
    # words: list of (text,key)
    f=ImageFont.truetype(FONT,128)
    img=Image.new("RGBA",(W,300),(0,0,0,0)); 
    parts=[w for w,_ in words]
    # layout RTL: first word at right
    ws=[]
    for w,k in words:
        bb=f.getbbox(w,direction="rtl",language="he",stroke_width=9); ws.append(bb[2]-bb[0])
    gap=36; total=sum(ws)+gap*(len(ws)-1)
    if total>W-80: f=ImageFont.truetype(FONT,int(128*(W-80)/total)); 
    ws=[]
    for w,k in words:
        bb=f.getbbox(w,direction="rtl",language="he",stroke_width=9); ws.append(bb[2]-bb[0])
    total=sum(ws)+gap*(len(ws)-1)
    x=(W+total)/2; lay=Image.new("RGBA",(W,300),(0,0,0,0)); d=ImageDraw.Draw(lay)
    sh=Image.new("RGBA",(W,300),(0,0,0,0)); sd=ImageDraw.Draw(sh)
    for (w,k),wd in zip(words,ws):
        x-=wd; bb=f.getbbox(w,direction="rtl",language="he",stroke_width=9)
        px=x-bb[0]; py=70
        col=(255,214,0) if k else (255,255,255)
        sd.text((px+6,py+12),w,font=f,fill=(0,0,0,255),direction="rtl",language="he",stroke_width=9,stroke_fill=(0,0,0,255))
        d.text((px,py),w,font=f,fill=col,direction="rtl",language="he",stroke_width=9,stroke_fill=(0,0,0,255))
        x-=gap
    from PIL import ImageFilter
    sh=sh.filter(ImageFilter.GaussianBlur(5)); 
    a=sh.split()[3].point(lambda v:int(v*0.8)); sh.putalpha(a)
    out=Image.alpha_composite(sh,lay); out.save(f"{B}/cap{i}.png"); return f"{B}/cap{i}.png"
def main():
    caps=json.load(open(S+"/captions.json")) if os.path.exists(S+"/captions.json") else []
    out=sys.argv[1] if len(sys.argv)>1 else B+"/out.mp4"
    cuts=starts[1:]
    ensure_audio(cuts+[MAIN],[starts[7]+0.35])
    endcard()
    inputs=["-i",SRC,"-loop","1","-t",str(END+0.2),"-i",B+"/end.png","-i",B+"/music.wav","-i",B+"/fx.wav"]
    capfiles=[]
    for i,c in enumerate(caps):
        capfiles.append(caption_png(i,c["words"])); inputs+=["-loop","1","-t",str(TOTAL),"-i",capfiles[-1]]
    fc=[];vl=[];al=[]
    for i,(s,d,k) in enumerate(SEGS):
        n=int(round(d*FPS))
        zs,ze=(1.0,1.28) if k=="hero" else (1.0,1.12)
        # punch-in: starts 1.14 decaying to base over 0.25s, plus slow zoom
        z=f"({zs}+({ze}-{zs})*t/{d})*(1+0.14*exp(-t*14))"
        sx=f"(iw-{W})/2+26*sin(t*70)*exp(-t*16)"; sy=f"(ih-{H})/2+18*cos(t*85)*exp(-t*16)"
        vf=(f"[0:v]trim=start={s}:duration={d},setpts=PTS-STARTPTS,fps={FPS},"
            f"hqdn3d=3:3:6:6,eq=brightness=0.06:contrast=1.15:saturation=1.05:gamma=1.2,"
            f"scale={W*1.0}:{H*1.0}:flags=lanczos,unsharp=5:5:0.9:5:5:0.0,"
            f"scale=w='{W}*{z}':h='{H}*{z}':eval=frame:flags=bilinear,crop={W}:{H}:x='{sx}':y='{sy}'")
        if k=="hero":
            fc.append(vf+f",split[h{i}a][h{i}b];[h{i}b]gblur=sigma=22,eq=brightness=-0.08:saturation=0.6[h{i}g];"
                      f"[h{i}a][h{i}g]blend=all_mode=screen:all_opacity=0.2,format=yuv420p[v{i}]")
        else:
            fc.append(vf+f",format=yuv420p[v{i}]")
        vl.append(f"[v{i}]")
        fc.append(f"[0:a]atrim=start={s}:duration={d},asetpts=PTS-STARTPTS,"
                  f"afade=t=in:d=0.03,afade=t=out:st={d-0.04}:d=0.04[a{i}]"); al.append(f"[a{i}]")
    fc.append("".join(vl)+f"concat=n={len(SEGS)}:v=1:a=0[vc]")
    # whip-pan blur + white flash at cuts
    chain="[vc]"; fl=[]
    for ct in cuts:
        fl.append(f"gblur=sigma=34:sigmaV=0:enable='between(t,{ct-0.07:.3f},{ct+0.07:.3f})'")
        fl.append(f"drawbox=x=0:y=0:w=iw:h=ih:color=white@0.65:t=fill:enable='between(t,{ct:.3f},{ct+0.04:.3f})'")
        fl.append(f"drawbox=x=0:y=0:w=iw:h=ih:color=white@0.3:t=fill:enable='between(t,{ct+0.04:.3f},{ct+0.09:.3f})'")
    fc.append("[vc]"+",".join(fl)+"[vf]")
    # captions overlay
    cur="[vf]"
    for i,c in enumerate(caps):
        nxt=f"[c{i}]"
        fc.append(f"{cur}[{4+i}:v]overlay=x=0:y={H-760}:enable='between(t,{c['start']:.3f},{c['end']:.3f})'{nxt}")
        cur=nxt
    # end card
    fc.append(f"[1:v]scale={W}:{H},fps={FPS},format=yuv420p,trim=duration={END},setpts=PTS-STARTPTS+{MAIN}/TB,"
              f"zoompan=z=1:d=1:s={W}x{H}[endv]" if False else
              f"[1:v]scale={W}:{H},fps={FPS},format=yuv420p,trim=duration={END},setpts=PTS-STARTPTS[endv]")
    fc.append(f"{cur}fps={FPS}[mainv]")
    fc.append(f"[mainv][endv]concat=n=2:v=1:a=0,fade=t=out:st={TOTAL-0.15}:d=0.15[vout]")
    # audio: speech chain
    fc.append("".join(al)+f"concat=n={len(SEGS)}:v=0:a=1,highpass=f=110,lowpass=f=7500,afftdn=nr=14:nf=-38,"
              f"acompressor=threshold=-24dB:ratio=3:attack=5:release=80,dynaudnorm=f=120:g=7:p=0.9,"
              f"volume=1.6,apad=whole_dur={TOTAL},atrim=duration={TOTAL}[sp]")
    fc.append("[sp]asplit[sp1][sp2]")
    fc.append(f"[2:a]atrim=duration={TOTAL},volume=0.5,afade=t=out:st={TOTAL-0.5}:d=0.5[mu]")
    fc.append("[mu][sp2]sidechaincompress=threshold=0.03:ratio=8:attack=10:release=250[mud]")
    fc.append(f"[3:a]atrim=duration={TOTAL},volume=0.9[fx]")
    fc.append("[sp1][mud][fx]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.95[aout]")
    cmd=["ffmpeg","-v","error","-y",*inputs,"-filter_complex",";".join(fc),"-map","[vout]","-map","[aout]",
         "-t",str(TOTAL),"-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-r",str(FPS),
         "-c:a","aac","-b:a","192k","-ar","44100","-movflags","+faststart",out]
    json.dump({"main":MAIN,"total":TOTAL,"starts":starts,"segs":SEGS},open(B+"/timeline.json","w"))
    print("total",TOTAL); subprocess.run(cmd,check=True)
main()
