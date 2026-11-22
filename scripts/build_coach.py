"""Regenerates src/coach.svg (the leopard coach). Run only when changing the drawing; poses/moods are CSS in src/styles.css."""
import math, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Cartoon leopard with near-realistic proportions and colouring. Mime only, no speech.
FUR, LIGHT, CREAM, SHADE, INK, ROS, ROSC = '#d99a3c', '#efc47a', '#fbf1de', '#a86a24', '#3a2412', '#1e130a', '#bf7e2c'
SW = 1.8   # outline width: thin, painterly

def rosette(x, y, s=1, rot=0, n=4):
    out = f'<circle cx="{x}" cy="{y}" r="{2.5*s:.2f}" fill="{ROSC}"/>'
    for k in range(n):
        a = math.radians(rot + k * 360 / n + (k % 2) * 14); r = 4.2 * s
        cx, cy = x + r * math.cos(a), y + r * math.sin(a)
        out += (f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{(2.4 if k % 2 else 1.9)*s:.2f}" ry="{1.25*s:.2f}" '
                f'transform="rotate({math.degrees(a)+90:.0f} {cx:.2f} {cy:.2f})" fill="{ROS}"/>')
    return out

def dots(pts):
    return ''.join(f'<circle cx="{p[0]}" cy="{p[1]}" r="{p[2] if len(p) > 2 else 1.2}" fill="{ROS}"/>' for p in pts)

def mirror(d):
    res, idx = [], 0
    for tok in re.findall(r'[MCLZQ]|-?\d+\.?\d*', d):
        if tok in 'MCLZQ': res.append(tok); idx = 0; continue
        res.append(f'{200 - float(tok):g}' if idx % 2 == 0 else tok); idx += 1
    return ' '.join(res)

EYE_L = 'M77,59 C79,52.5 89,50.5 95,55.5 C93,61 83,63.5 77,59 Z'
def eye(side):
    cx = 86 if side == 'L' else 114
    shape = EYE_L if side == 'L' else mirror(EYE_L)
    happy = 'M77,59 C81,53.5 90,53.5 95,56.5' if side == 'L' else mirror('M77,59 C81,53.5 90,53.5 95,56.5')
    return f'''<clipPath id="clip{side}"><path d="{shape}"/></clipPath>
<g class="eyeopen"><g clip-path="url(#clip{side})">
 <path d="{shape}" fill="#fffaf0"/>
 <g id="pup{side}" class="pup"><g class="pupi">
  <circle cx="{cx}" cy="57" r="5" fill="url(#iris)" stroke="#5b5a12" stroke-width=".6"/><circle cx="{cx}" cy="57" r="2.3" fill="#120a04"/>
  <circle cx="{cx+1.8}" cy="55" r="1.3" fill="#fff"/></g></g>
 <g id="lid{side}" class="lid"><g class="lidi"><path d="M-14,-22 L14,-22 L14,0 C6,1.8 -6,1.8 -14,0 Z" fill="{FUR}"/>
  <path d="M-14,0 C-6,1.8 6,1.8 14,0" fill="none" stroke="{INK}" stroke-width="1.8"/></g></g>
</g>
<path d="{shape}" fill="none" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/></g>
<path class="happyeye" d="{happy}" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'''

HEAD = ('M100,30 C116,30 129,37 134,50 C137,58 137,68 133,77 C129,87 120,95 110,99 C106,101 103,102 100,102 '
        'C97,102 94,101 90,99 C80,95 71,87 67,77 C63,68 63,58 66,50 C71,37 84,30 100,30 Z')
L_EAR, L_EARIN = 'M69,46 C62,36 66,25 76,24 C85,23 90,31 89,40 Z', 'M72,42 C68,35 70,29 76,28.5 C82,28 85,33 85,39 Z'
L_HAUNCH = 'M26,232 C18,212 22,180 44,168 C62,160 80,172 84,192 C86,210 80,226 70,232 Z'
L_LEG = 'M73,116 C64,140 68,170 73,196 C75,208 75,218 75,226 L93,226 C93,212 92,198 93,186 C95,162 96,142 94,120 Z'
L_LEGSH = 'M73,116 C64,140 68,170 73,196 C75,208 75,218 75,226 L80,226 C79,206 72,176 74,150 C75,136 78,126 82,118 Z'
TAIL1 = 'M146,226 C180,234 197,216 192,190'
TAIL2 = 'M192,190 C189,170 181,158 187,144 C189,138 194,135 199,136'

svg = f'''<svg class="leo-coach m-idle" id="coachSvg" viewBox="0 0 210 240" role="img" aria-label="Тренер-леопард">
<defs><radialGradient id="iris" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#f0e27a"/><stop offset=".55" stop-color="#c9b83a"/><stop offset="1" stop-color="#7c7a1c"/></radialGradient>
<linearGradient id="furg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4a748"/><stop offset="1" stop-color="#cf8d33"/></linearGradient></defs>
<g id="lAll">
 <g id="tail1" class="pose"><g class="t1a">
  <path d="{TAIL1}" fill="none" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>
  <path d="{TAIL1}" fill="none" stroke="{FUR}" stroke-width="10.6" stroke-linecap="round"/>
  <path d="M152,229 C180,234 197,216 192,192" fill="none" stroke="{ROS}" stroke-width="4.4" stroke-linecap="round" stroke-dasharray="0.1 8.5"/>
  <g id="tail2" class="pose"><g class="t2a">
   <path d="{TAIL2}" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>
   <path d="{TAIL2}" fill="none" stroke="{FUR}" stroke-width="8.6" stroke-linecap="round"/>
   <path d="M191,184 C189,170 181,158 186,147" fill="none" stroke="{ROS}" stroke-width="3.8" stroke-linecap="round" stroke-dasharray="0.1 7.5"/>
   <path d="M187,144 C189,138 194,135 199,136" fill="none" stroke="{ROS}" stroke-width="8.6" stroke-linecap="round"/>
  </g></g>
 </g></g>
 <g id="body"><g class="bodyi">
  <path d="{L_HAUNCH}" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
  <path d="{mirror(L_HAUNCH)}" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
  <path d="M26,232 C18,214 20,190 34,176 C32,196 38,216 52,232 Z" fill="{SHADE}" opacity=".5"/>
  <path d="M174,232 C182,214 180,190 166,176 C168,196 162,216 148,232 Z" fill="{SHADE}" opacity=".5"/>
  {rosette(52,186,1.3,10)}{rosette(68,206,1.15,40)}{rosette(40,208,1,5)}{rosette(58,222,.9,70)}{rosette(66,178,.85,20,3)}
  {rosette(148,186,1.3,-10)}{rosette(132,206,1.15,25)}{rosette(160,208,1,35)}{rosette(142,222,.9,-20)}{rosette(134,178,.85,50,3)}
  <ellipse cx="46" cy="231" rx="18" ry="6.5" fill="{LIGHT}" stroke="{INK}" stroke-width="{SW}"/>
  <ellipse cx="154" cy="231" rx="18" ry="6.5" fill="{LIGHT}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M72,92 C57,112 55,150 60,232 L140,232 C145,150 143,112 128,92 Z" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
  <path d="M82,98 C77,130 86,178 100,214 C114,178 123,130 118,98 Z" fill="{CREAM}"/>
  {dots([(100,132,1.3),(97,150,1.2),(103,150,1.2),(100,168,1.1),(99,186,1),(88,112,1),(112,112,1),(100,118,1.1)])}
  {rosette(66,124,.9,30,3)}{rosette(134,124,.9,-30,3)}{rosette(64,150,.8,10,3)}{rosette(136,150,.8,-10,3)}
  <ellipse cx="100" cy="104" rx="22" ry="7" fill="{SHADE}" opacity=".35"/>
  <path d="{L_LEG}" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
  <path d="{L_LEGSH}" fill="{SHADE}" opacity=".45"/>
  {dots([(84,134,1.8),(78,148,1.6),(88,152,1.5),(82,166,1.5),(89,176,1.3),(80,186,1.3),(87,198,1.2),(82,210,1.1)])}
  <ellipse cx="84" cy="228" rx="12.5" ry="6.6" fill="{LIGHT}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M80,225 L80,231 M85,224.5 L85,231 M90,225 L90,231" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/>
  <g id="pawR" class="pose"><g class="pawi">
   <path d="{mirror(L_LEG)}" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
   <path d="{mirror(L_LEGSH)}" fill="{SHADE}" opacity=".45"/>
   {dots([(116,134,1.8),(122,148,1.6),(112,152,1.5),(118,166,1.5),(111,176,1.3),(120,186,1.3),(113,198,1.2),(118,210,1.1)])}
   <ellipse cx="116" cy="228" rx="12.5" ry="6.6" fill="{LIGHT}" stroke="{INK}" stroke-width="{SW}"/>
   <path d="M110,225 L110,231 M115,224.5 L115,231 M120,225 L120,231" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/>
  </g></g>
 </g></g>
 <g id="head" class="pose"><g class="headi" transform="translate(100 102) scale(1.17) translate(-100 -102)">
  <g id="earL" class="pose ear"><g class="eari"><path d="{L_EAR}" fill="{FUR}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/><path d="{L_EARIN}" fill="#f3dcc8"/>
   <path d="M73,36 L77,39 M75,32 L79,36" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g></g>
  <g id="earR" class="pose ear"><g class="eari"><path d="{mirror(L_EAR)}" fill="{FUR}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/><path d="{mirror(L_EARIN)}" fill="#f3dcc8"/>
   <path d="M127,36 L123,39 M125,32 L121,36" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g></g>
  <path d="{HEAD}" fill="url(#furg)" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
  <path d="M67,77 C71,87 80,95 90,99 C94,101 97,102 100,102 C103,102 106,101 110,99 C120,95 129,87 133,77 C128,92 116,100 100,100 C84,100 72,92 67,77 Z" fill="{SHADE}" opacity=".4"/>
  {dots([(92,38,1.3),(100,36,1.4),(108,38,1.3),(88,43,1.2),(96,42,1.1),(104,42,1.1),(112,43,1.2),(92,47,1),(100,46,1.1),(108,47,1),
         (75,44,1.1),(71,52,1.2),(125,44,1.1),(129,52,1.2),(69,62,1.3),(72,70,1.2),(131,62,1.3),(128,70,1.2),(68,78,1),(132,78,1),(74,84,1),(126,84,1)])}
  <path d="M78,63 C82,65.5 89,65.5 94,62.5 M122,63 C118,65.5 111,65.5 106,62.5" stroke="{CREAM}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M95,52 C97,60 97,66 95,70 L105,70 C103,66 103,60 105,52 Z" fill="{LIGHT}" opacity=".55"/>
  <path d="M100,66 C109,66 117,72 118,80 C119,90 111,98 100,98 C89,98 81,90 82,80 C83,72 91,66 100,66 Z" fill="{CREAM}"/>
  {dots([(88,79,.7),(91,82,.7),(87,84,.7),(112,79,.7),(109,82,.7),(113,84,.7)])}
  {eye('L')}{eye('R')}
  <g id="browL" class="pose brow"><path d="M76,50 C82,45.5 90,45.5 96,48.5" stroke="{ROS}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/></g>
  <g id="browR" class="pose brow"><path d="M124,50 C118,45.5 110,45.5 104,48.5" stroke="{ROS}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/></g>
  <path d="M93,70 C93,66.5 107,66.5 107,70 C107,74 102,77 100,77.5 C98,77 93,74 93,70 Z" fill="#b8665a" stroke="{INK}" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M95.5,71.5 C96.5,72.6 97.6,72.8 98.4,72.2 M104.5,71.5 C103.5,72.6 102.4,72.8 101.6,72.2" stroke="{INK}" stroke-width="1" fill="none" stroke-linecap="round"/>
  <ellipse cx="97.5" cy="68.6" rx="2.2" ry=".9" fill="#fff" opacity=".45"/>
  <g class="mouth m-smile"><path d="M100,77.5 L100,81 M100,81 C97,85 92,85 89,82 M100,81 C103,85 108,85 111,82" stroke="{INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/></g>
  <g class="mouth m-grin"><path d="M100,77.5 L100,81" stroke="{INK}" stroke-width="1.7" stroke-linecap="round"/><path d="M88,81.5 C92,94 108,94 112,81.5 C106,84.5 94,84.5 88,81.5 Z" fill="#5e1b1b" stroke="{INK}" stroke-width="1.7" stroke-linejoin="round"/>
   <path d="M94,88.6 C97,86.6 103,86.6 106,88.6 C103,91.4 97,91.4 94,88.6 Z" fill="#d9707f"/><path d="M91,83 L92.6,87 L94.2,83.6 M109,83 L107.4,87 L105.8,83.6" fill="#fff" stroke="{INK}" stroke-width=".7" stroke-linejoin="round"/></g>
  <g class="mouth m-frown"><path d="M100,77.5 L100,81.5 M90,88 C94,82.5 106,82.5 110,88" stroke="{INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>
  <g class="mouth m-o"><path d="M100,77.5 L100,80.5" stroke="{INK}" stroke-width="1.7" stroke-linecap="round"/><ellipse cx="100" cy="85.5" rx="3.6" ry="4.4" fill="#5e1b1b" stroke="{INK}" stroke-width="1.6"/></g>
  <g class="mouth m-smirk"><path d="M100,77.5 L100,81 M100,81 C97,83.5 93,83.5 90,82.5 M100,81 C104,84.5 109,83.5 113,78.5" stroke="{INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/></g>
  <g id="whisk"><g class="whiski" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".9">
   <path d="M84,78 C70,74 60,74 48,76 M84,82 C70,81 60,83 50,86 M85,86 C74,88 66,92 58,97"/>
   <path d="M116,78 C130,74 140,74 152,76 M116,82 C130,81 140,83 150,86 M115,86 C126,88 134,92 142,97"/></g></g>
 </g></g>
 <g class="fx fx-sweat"><path d="M146,30 C151,38 152.5,43 146,45 C139.5,43 141,38 146,30 Z" fill="#8fd0ff" stroke="#2f6f9f" stroke-width="1.4"/></g>
 <g class="fx fx-pop" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"><path d="M52,24 L42,16 M48,38 L36,38 M148,24 L158,16 M152,38 L164,38 M100,18 L100,6"/></g>
 <g class="fx fx-stars" fill="#ffd54a" stroke="#b07d00" stroke-width="1">
  <path class="s1" d="M30,52 L33,60 L41,62 L33,64 L30,72 L27,64 L19,62 L27,60 Z"/>
  <path class="s2" d="M170,44 L172.5,50.5 L179,52 L172.5,53.5 L170,60 L167.5,53.5 L161,52 L167.5,50.5 Z"/>
  <path class="s3" d="M22,118 L24,123.5 L29.5,125 L24,126.5 L22,132 L20,126.5 L14.5,125 L20,123.5 Z"/>
 </g>
 <g class="fx fx-heart"><path d="M166,82 C160,76 150,80 154,89 C156.5,94 166,100 166,100 C166,100 175.5,94 178,89 C182,80 172,76 166,82 Z" fill="#ff5c8a" stroke="#a3204a" stroke-width="1.6"/></g>
</g>
</svg>'''
open(os.path.join(ROOT, 'src', 'coach.svg'), 'w').write(svg + '\n')
print(len(svg))
