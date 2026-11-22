"""Hand-drawn SVG pawns/knight details for the fox, lynx and panda themes."""
def mirror(d):
    import re
    # mirror x coords of a path made of absolute commands with x,y pairs
    nums = re.split(r'([MCLZ])', d); out=''
    for t in nums:
        if t in 'MCLZ' or not t.strip(): out+=t; continue
        pts=[p for p in t.replace(',',' ').split()]
        out+=' '.join(f'{45-float(pts[i]):.2f},{pts[i+1]}' for i in range(0,len(pts),2))
    return out

def fox_pawn(fur, dark, light, socks, blush):
    ear = 'M14.3,9.6 C15.8,10.8 17.2,12 18,13.4 C16.6,13.8 15.4,14.8 14.6,15.8 C14.3,13.6 14.2,11.6 14.3,9.6Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g stroke="#000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
<path d="M28.5,38.8 C37,39.6 42.6,33 41.2,25 C40.2,19.4 34.4,17.8 32.6,22 C36,26 35.6,31.6 28.5,33.6 Z" fill="{fur}"/>
<path d="M41.2,25 C40.2,19.4 34.4,17.8 32.6,22 C34.7,23.6 36.2,25.7 36.8,27.8 C38.5,27.6 40,26.6 41.2,25 Z" fill="{light}"/>
<path d="M13,39.5 C13,33 15.5,28.5 18.5,26 L26.5,26 C29.5,28.5 32,33 32,39.5 Z" fill="{fur}"/>
<path d="M19.2,27.5 C20,31 21,33.4 22.5,34.6 C24,33.4 25,31 25.8,27.5 Z" fill="{light}" stroke="none"/>
<ellipse cx="19" cy="38.6" rx="2.3" ry="1.4" fill="{socks}" stroke-width="1"/><ellipse cx="26" cy="38.6" rx="2.3" ry="1.4" fill="{socks}" stroke-width="1"/>
<path d="M22.5,28.5 C19,28.5 15,25 13.5,21 C12.5,18 12.5,13 13,7.5 C15.5,9 18,11 19.5,13 C21.5,12.5 23.5,12.5 25.5,13 C27,11 29.5,9 32,7.5 C32.5,13 32.5,18 31.5,21 C30,25 26,28.5 22.5,28.5 Z" fill="{fur}"/>
<path d="M13.7,21.3 C16.2,21.4 19.4,22 22.5,24.2 C25.6,22 28.8,21.4 31.3,21.3 C29.8,25.2 26,28.5 22.5,28.5 C19,28.5 15.2,25.2 13.7,21.3 Z" fill="{light}" stroke="none"/>
<path d="M22.5,28.5 C19,28.5 15,25 13.5,21 M22.5,28.5 C26,28.5 30,25 31.5,21" fill="none"/>
<path d="{ear}" fill="{dark}" stroke="none"/><path d="{mirror(ear)}" fill="{dark}" stroke="none"/>
</g>
<circle cx="16.4" cy="23" r="1.5" fill="{blush}" opacity=".55"/><circle cx="28.6" cy="23" r="1.5" fill="{blush}" opacity=".55"/>
<ellipse cx="18.8" cy="18.4" rx="1.15" ry="1.5" fill="#1a1a1a"/><ellipse cx="26.2" cy="18.4" rx="1.15" ry="1.5" fill="#1a1a1a"/>
<circle cx="19.2" cy="17.8" r=".45" fill="#fff"/><circle cx="26.6" cy="17.8" r=".45" fill="#fff"/>
<ellipse cx="22.5" cy="25.7" rx="1.5" ry="1.05" fill="#1a1a1a"/>
</svg>'''

WHITE_FOX = fox_pawn('#f1e8dc', '#b9c3cc', '#ffffff', '#cfc5b8', '#f4a6b8')   # arctic fox
RED_FOX   = fox_pawn('#d9631e', '#5a2a10', '#fff4e6', '#3a1f10', '#ff8fa3')   # red fox

def lynx_pawn(fur, dark, light, spot, inner, blush):
    ear = 'M14.2,15.8 L14,8.4 L20.2,13.2 Z'
    ear_in = 'M15.1,14.2 L15,10.6 L18.4,13.3 Z'
    tuft = 'M14,8.6 C13.6,6.4 13.1,4.6 12.3,3.2'
    head = ('M22.5,12.6 C25.6,12.6 28.3,13 30.4,14.4 C32.4,16 33,18.6 32.7,21 L34.4,25.8 L30.7,24.8 '
            'L31.3,27.6 L27.4,26.7 C26,28.3 24.4,29 22.5,29 C20.6,29 19,28.3 17.6,26.7 L13.7,27.6 '
            'L14.3,24.8 L10.6,25.8 L12.3,21 C12,18.6 12.6,16 14.6,14.4 C16.7,13 19.4,12.6 22.5,12.6 Z')
    spots = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{r*1.2:.2f}" ry="{r}" fill="{spot}"/>'
                    for x, y, r in [(16.2, 34.5, 1), (28.8, 33.2, .9), (17.4, 30.6, .75), (28.2, 36.8, .8), (15.6, 37.6, .7), (29.6, 30.2, .6)])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><g stroke="#000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
<path d="M30.5,36.6 C33.6,36.7 36.2,35.6 37.5,33.6 C38,32.5 37.1,31.6 36,32.1 C34.4,32.9 32.4,33.2 30.5,32.9 Z" fill="{fur}"/>
<path d="M35.4,32.5 C36.2,32.1 37.6,31.7 37.6,33 C37.4,34 36.6,34.6 35.6,35.2 Z" fill="#1a1a1a" stroke-width="1"/>
<path d="M13,39.5 C13,33 15.5,28.5 18.5,26 L26.5,26 C29.5,28.5 32,33 32,39.5 Z" fill="{fur}"/>
</g>
{spots}
<path d="M19.2,27.5 C20,31 21,33.4 22.5,34.6 C24,33.4 25,31 25.8,27.5 Z" fill="{light}"/>
<g stroke="#000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
<ellipse cx="19" cy="38.6" rx="2.3" ry="1.4" fill="{light}" stroke-width="1"/><ellipse cx="26" cy="38.6" rx="2.3" ry="1.4" fill="{light}" stroke-width="1"/>
<path d="{tuft}" fill="none" stroke="#111" stroke-width="1.8"/><path d="{mirror(tuft)}" fill="none" stroke="#111" stroke-width="1.8"/>
<path d="{ear}" fill="{dark}"/><path d="{mirror(ear)}" fill="{dark}"/>
<path d="{head}" fill="{fur}"/>
</g>
<path d="{ear_in}" fill="{inner}"/><path d="{mirror(ear_in)}" fill="{inner}"/>
<ellipse cx="22.5" cy="24.2" rx="4.8" ry="3.6" fill="{light}"/>
<path d="M14.6,21.4 L12.4,22.6 M15,23.2 L13,24.6 M30.4,21.4 L32.6,22.6 M30,23.2 L32,24.6" stroke="{dark}" stroke-width=".8" stroke-linecap="round"/>
<path d="M22.5,13.2 L22.5,16.2 M20.4,13.6 L20.8,15.6 M24.6,13.6 L24.2,15.6" stroke="{dark}" stroke-width=".7" stroke-linecap="round"/>
<circle cx="16.6" cy="23.4" r="1.4" fill="{blush}" opacity=".5"/><circle cx="28.4" cy="23.4" r="1.4" fill="{blush}" opacity=".5"/>
<ellipse cx="19.1" cy="19.4" rx="1.3" ry="1.45" fill="#d4a017"/><ellipse cx="25.9" cy="19.4" rx="1.3" ry="1.45" fill="#d4a017"/>
<ellipse cx="19.1" cy="19.4" rx=".55" ry="1.2" fill="#111"/><ellipse cx="25.9" cy="19.4" rx=".55" ry="1.2" fill="#111"/>
<circle cx="19.5" cy="18.8" r=".35" fill="#fff"/><circle cx="26.3" cy="18.8" r=".35" fill="#fff"/>
<path d="M21.2,22.3 L23.8,22.3 L22.5,23.7 Z" fill="#3a2a22"/>
<path d="M22.5,23.7 L22.5,24.6 M22.5,24.6 C21.8,25.4 20.8,25.4 20.2,24.8 M22.5,24.6 C23.2,25.4 24.2,25.4 24.8,24.8" stroke="#3a2a22" stroke-width=".7" fill="none" stroke-linecap="round"/>
<path d="M22.5,12.6 C19.4,12.6 16.7,13 14.6,14.4 C12.6,16 12,18.6 12.3,21 L10.6,25.8 L14.3,24.8 L13.7,27.6 L17.6,26.7 C19,28.3 20.6,29 22.5,29 C24.4,29 26,28.3 27.4,26.7 L31.3,27.6 L30.7,24.8 L34.4,25.8 L32.7,21 C33,18.6 32.4,16 30.4,14.4 C28.3,13 25.6,12.6 22.5,12.6 Z" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
</svg>'''

WHITE_LYNX = lynx_pawn('#e8e0d2', '#6e6255', '#fbf7f0', '#8a7a68', '#f6efe4', '#f4a6b8')   # pale northern lynx
DARK_LYNX  = lynx_pawn('#8a6440', '#3a2a1c', '#e9d7bd', '#2a1d12', '#e9d7bd', '#ff8fa3')   # dark tawny lynx

def panda_pawn():
    K, W = '#1c1c1c', '#fdfdfb'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
<g stroke="#000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
<path d="M13,39.5 C13,32.5 15.8,28 19,26 L26,26 C29.2,28 32,32.5 32,39.5 Z" fill="{W}"/>
<path d="M17.2,27.8 C20.6,29.4 24.4,29.4 27.8,27.8 C29.6,29.6 30.8,31.4 31.4,33.4 C28.6,32.2 16.4,32.2 13.6,33.4 C14.2,31.4 15.4,29.6 17.2,27.8 Z" fill="{K}"/>
<path d="M31.6,40.2 L35.4,22.6" stroke="#3f7a26" stroke-width="3.4"/><path d="M31.6,40.2 L35.4,22.6" stroke="#79b84a" stroke-width="1.6"/>
<path d="M34.6,26.4 L36.4,26.8 M33.4,32 L35.2,32.4" stroke="#3f7a26" stroke-width=".9"/>
<path d="M35.4,22.8 C37.6,20.6 40.4,20.2 42,20.8 C40.6,22.8 38,23.6 35.4,22.8 Z" fill="#79b84a" stroke-width="1"/>
<ellipse cx="16.6" cy="33.6" rx="2.6" ry="4.4" transform="rotate(14 16.6 33.6)" fill="{K}"/>
<ellipse cx="29.4" cy="31.6" rx="2.6" ry="4" transform="rotate(-38 29.4 31.6)" fill="{K}"/>
<ellipse cx="18.4" cy="38.8" rx="3" ry="1.7" fill="{K}"/><ellipse cx="26.6" cy="38.8" rx="3" ry="1.7" fill="{K}"/>
<circle cx="15.2" cy="12.2" r="3.4" fill="{K}"/><circle cx="29.8" cy="12.2" r="3.4" fill="{K}"/>
<path d="M22.5,10.6 C28.4,10.6 32.4,14.4 32.4,19.4 C32.4,24.6 28,28 22.5,28 C17,28 12.6,24.6 12.6,19.4 C12.6,14.4 16.6,10.6 22.5,10.6 Z" fill="{W}"/>
</g>
<ellipse cx="18.4" cy="18.8" rx="2.5" ry="3.2" transform="rotate(30 18.4 18.8)" fill="{K}"/>
<ellipse cx="26.6" cy="18.8" rx="2.5" ry="3.2" transform="rotate(-30 26.6 18.8)" fill="{K}"/>
<circle cx="18.7" cy="18.4" r="1.1" fill="#fff"/><circle cx="26.3" cy="18.4" r="1.1" fill="#fff"/>
<circle cx="18.9" cy="18.6" r=".55" fill="#111"/><circle cx="26.1" cy="18.6" r=".55" fill="#111"/>
<circle cx="15.6" cy="23" r="1.4" fill="#f4a6b8" opacity=".6"/><circle cx="29.4" cy="23" r="1.4" fill="#f4a6b8" opacity=".6"/>
<ellipse cx="22.5" cy="22.4" rx="1.5" ry="1" fill="#111"/>
<path d="M22.5,23.3 L22.5,24.2 M22.5,24.2 C21.8,25 20.9,25 20.3,24.4 M22.5,24.2 C23.2,25 24.1,25 24.7,24.4" stroke="#111" stroke-width=".7" fill="none" stroke-linecap="round"/>
</svg>'''

def red_panda_pawn():
    R, D, L, T = '#c2521f', '#3b1f14', '#f6ead6', '#7a2e10'
    tail = 'M29.5,38.8 C37.5,39.4 41.8,33.2 40.6,26.4 C40,22.8 36.4,21.4 34.6,23.6 C36.8,27.4 35.6,32.6 29.5,33.8 Z'
    head = 'M22.5,12.8 C28.5,12.8 32.6,16.2 32.6,20.6 C32.6,25.3 28,28.6 22.5,28.6 C17,28.6 12.4,25.3 12.4,20.6 C12.4,16.2 16.5,12.8 22.5,12.8 Z'
    ear = 'M13.6,17 C12.6,13 13.2,10 15.2,9 C17.4,9.6 19,11.4 19.6,13.4 Z'
    ear_in = 'M14.8,15 C14.4,12.8 14.8,11.2 15.6,10.6 C16.8,11.2 17.6,12.2 18,13.4 Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
<defs><clipPath id="tl"><path d="{tail}"/></clipPath></defs>
<path d="{tail}" fill="{R}"/>
<g clip-path="url(#tl)" stroke="#f0c48a" stroke-width="2"><path d="M32.6,41 L37.4,32.8 M36.4,38.6 L42,31.8 M36.6,31 L42.6,28.6 M34.6,25.8 L41,24.4"/></g>
<g stroke="#000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
<path d="{tail}" fill="none"/>
<path d="M13,39.5 C13,33 15.5,28.5 18.5,26 L26.5,26 C29.5,28.5 32,33 32,39.5 Z" fill="{D}"/>
<path d="M18.5,26 L26.5,26 C28.3,27.6 29.8,29.6 30.6,31.6 C27,30.6 18,30.6 14.4,31.6 C15.2,29.6 16.7,27.6 18.5,26 Z" fill="{R}" stroke="none"/>
<ellipse cx="18.6" cy="38.8" rx="2.6" ry="1.5" fill="{D}" stroke-width="1"/><ellipse cx="26.4" cy="38.8" rx="2.6" ry="1.5" fill="{D}" stroke-width="1"/>
<path d="{ear}" fill="{L}"/><path d="{mirror(ear)}" fill="{L}"/>
<path d="{head}" fill="{R}"/>
</g>
<path d="{ear_in}" fill="{T}"/><path d="{mirror(ear_in)}" fill="{T}"/>
<ellipse cx="14.8" cy="22.6" rx="2.2" ry="2.8" fill="{L}"/><ellipse cx="30.2" cy="22.6" rx="2.2" ry="2.8" fill="{L}"/>
<ellipse cx="22.5" cy="24.6" rx="4.6" ry="3.4" fill="{L}"/>
<ellipse cx="18.4" cy="16.4" rx="1.7" ry="1.05" fill="{L}"/><ellipse cx="26.6" cy="16.4" rx="1.7" ry="1.05" fill="{L}"/>
<path d="M18.6,20.6 C18.4,22.6 17.8,24.2 16.8,25.6 M26.4,20.6 C26.6,22.6 27.2,24.2 28.2,25.6" stroke="{T}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="{head}" fill="none" stroke="#000" stroke-width="1.5"/>
<circle cx="18.6" cy="19.4" r="1.3" fill="#111"/><circle cx="26.4" cy="19.4" r="1.3" fill="#111"/>
<circle cx="19" cy="18.9" r=".45" fill="#fff"/><circle cx="26.8" cy="18.9" r=".45" fill="#fff"/>
<circle cx="15.4" cy="25.2" r="1.2" fill="#ff8fa3" opacity=".55"/><circle cx="29.6" cy="25.2" r="1.2" fill="#ff8fa3" opacity=".55"/>
<ellipse cx="22.5" cy="23.2" rx="1.5" ry="1" fill="#111"/>
<path d="M22.5,24.1 L22.5,25 M22.5,25 C21.8,25.8 20.9,25.8 20.3,25.2 M22.5,25 C23.2,25.8 24.1,25.8 24.7,25.2" stroke="#111" stroke-width=".7" fill="none" stroke-linecap="round"/>
</svg>'''

PANDA = panda_pawn()
RED_PANDA = red_panda_pawn()

# knight extras (ear tips at ~(13.5,7.5) and (21,7); eye at ~(14.9,15.8))
KNIGHT_PANDA = ('<g stroke="#000" stroke-width="1.2"><circle cx="13.2" cy="8.2" r="2.7" fill="#1c1c1c"/><circle cx="20.8" cy="7.6" r="2.7" fill="#1c1c1c"/></g>'
                '<ellipse cx="14.6" cy="16" rx="3.8" ry="2.5" transform="rotate(-35 14.6 16)" fill="#1c1c1c"/>'
                '<circle cx="14.9" cy="15.6" r=".75" fill="#fff"/>')
KNIGHT_RED = ('<g stroke="#000" stroke-width="1.2"><circle cx="13.2" cy="8.2" r="2.5" fill="#f6ead6"/><circle cx="20.8" cy="7.6" r="2.5" fill="#f6ead6"/></g>'
              '<circle cx="13.4" cy="8.4" r="1.2" fill="#7a2e10"/><circle cx="21" cy="7.8" r="1.2" fill="#7a2e10"/>'
              '<ellipse cx="13.6" cy="13.6" rx="1.5" ry=".9" transform="rotate(-30 13.6 13.6)" fill="#f6ead6"/>')
