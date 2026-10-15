import subprocess
SRC = "/root/.claude/uploads/14d24d4b-1bb6-5459-9923-0367b985b457/1865bcc5-VID-20261015-WA0039.mp4"
OUT = "/home/user/-1/output/edited.mp4"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# (start, end, caption, caption_color)
SEGS = [(0, 6.5, "נעליים חדשות", "yellow"), (8, 12.5, "הם לא מאמינים", "white"),
        (26, 29, "רצים לסגור", "white"), (35, 43, "סגרנו עסקה", "yellow")]
W, H = 1080, 1920
parts, labels, t = [], [], 0.0
for i, (s, e, cap, col) in enumerate(SEGS):
    d = e - s
    parts.append(
        f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"eq=brightness=0.08:contrast=1.2:saturation=1.3:gamma=1.15,hqdn3d=3,unsharp=5:5:0.8,"
        f"zoompan=z='1.0+0.12*exp(-3*on/30)+0.0004*on':d=1:s={W}x{H}:fps=30,"
        f"drawtext=fontfile={FONT}:text='{cap}':fontsize=96:fontcolor={col}:borderw=8:bordercolor=black:"
        f"x=(w-text_w)/2:y=h*0.72:enable='between(t,0.2,{d-0.1})',"
        f"fade=t=in:st=0:d=0.12:color=white[v{i}]")
    parts.append(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,highpass=f=100,afftdn=nf=-30,loudnorm=I=-16[a{i}]")
    labels.append(f"[v{i}][a{i}]")
total = sum(e - s for s, e, *_ in SEGS)
parts.append("".join(labels) + f"concat=n={len(SEGS)}:v=1:a=1[v][a0]")
# end card
parts.append(f"color=c=black:s={W}x{H}:d=1.2:r=30,drawtext=fontfile={FONT}:text='רוצים עוד? עקבו':fontsize=100:"
             f"fontcolor=yellow:borderw=6:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2[endv]")
parts.append("anullsrc=r=44100:cl=stereo,atrim=0:1.2[enda]")
parts.append("[a0]aformat=sample_rates=44100:channel_layouts=stereo[a1]")
parts.append("[v][a1][endv][enda]concat=n=2:v=1:a=1[vf][af]")
# beat bed
dur = total + 1.2
parts.append(f"aevalsrc='0.5*sin(2*PI*55*t)*exp(-12*mod(t,0.4286))+0.06*random(0)*exp(-40*mod(t+0.2143,0.4286))':s=44100:d={dur}[beat]")
parts.append("[beat]volume=0.35,aformat=channel_layouts=stereo[bt]")
parts.append("[af][bt]amix=inputs=2:duration=first:weights=1 0.5[aout]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", SRC, "-filter_complex", ";".join(parts),
                "-map", "[vf]", "-map", "[aout]", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                "-r", "30", "-c:a", "aac", "-b:a", "160k", OUT], check=True)
