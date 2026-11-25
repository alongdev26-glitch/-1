# Blender: bakes Zuko (CGTrader blend) into a skinned, game-ready GLB. Rest (T) pose, flat per-region materials, Mixamo skeleton.
# usage: python3 export_zuko.py <zuko.blend> <out.glb> [static]
import bpy, sys, math
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[-3:]
STATIC = 'static' in sys.argv[-1]
src, out = (sys.argv[-3], sys.argv[-2]) if STATIC else (sys.argv[-2], sys.argv[-1])
bpy.ops.wm.open_mainfile(filepath=src)
arm = bpy.data.objects['Armature']
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(1)
KEEP = {'body': ('Zuko:Proxy.002', 6500), 'outfit': ('Zuko outfit', 17000), 'head': ('model.002', 5000), 'eyeL': ('Zuko:High-poly.004', 400), 'eyeR': ('Zuko:High-poly.005', 400)}

# --- materials (flat) ---
def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True
    c = tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in rgb) + (1,)
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = c; b.inputs['Roughness'].default_value = rough
    return m
H2 = lambda h: ((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255)
M = {n: mat(n, H2(h)) for n, h in dict(skin=0xe3b18b, hair=0x1c1411, brown=0x4a1d14, red=0x9c1f1c, gold=0xe0a824, boot=0x3a1a14, scar=0xb8454a, eye=0x2a1a0a, white=0xf2f2f2).items()}
ORDER = ['skin', 'hair', 'brown', 'red', 'gold', 'boot', 'scar', 'eye', 'white']
IDX = {n: i for i, n in enumerate(ORDER)}

# --- static, world-space evaluated copies (armature at rest, subsurf/particles off) ---
for o in bpy.data.objects:
    for m in o.modifiers:
        if m.type in ('SUBSURF', 'PARTICLE_SYSTEM'): m.show_viewport = False
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
col = bpy.data.collections.new('exp'); bpy.context.scene.collection.children.link(col)
objs = {}
for key, (name, budget) in KEEP.items():
    o = bpy.data.objects[name]
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False)
    me.transform(o.matrix_world)
    ob = bpy.data.objects.new(key, me); col.objects.link(ob)
    if key == 'body':      # keep the original skin weights (same vertex order, no topology modifiers)
        for g in o.vertex_groups: ob.vertex_groups.new(name=g.name)
        for v in o.data.vertices:
            for g in v.groups: ob.vertex_groups[g.group].add([v.index], g.weight, 'REPLACE')
    objs[key] = (ob, budget)
srcbody = bpy.data.objects.new('srcbody', objs['body'][0].data.copy()); col.objects.link(srcbody)
for g in objs['body'][0].vertex_groups: srcbody.vertex_groups.new(name=g.name)
for v in objs['body'][0].data.vertices:
    for g in v.groups: srcbody.vertex_groups[g.group].add([v.index], g.weight, 'REPLACE')
allv = [v.co for ob, _ in objs.values() for v in ob.data.vertices]
zmin, zmax = min(v.z for v in allv), max(v.z for v in allv)
print('height', zmax - zmin, 'zmin', zmin)

# --- per-region materials (Blender: x side, y = -front, z = up). meters ---
def paint(key, ob):
    me = ob.data; me.materials.clear()
    for n in ORDER: me.materials.append(M[n])
    for p in me.polygons:
        c = p.center; x, h, f = c.x, c.z - zmin, -c.y; ax = abs(x); n = 'skin'
        if key == 'outfit':
            if h < 0.30: n = 'boot'
            elif h < 0.47: n = 'red'
            elif 0.88 < h < 0.99: n = 'gold'
            elif ax > 0.19 and h > 0.99: n = 'red'
            else: n = 'brown'
        elif key == 'body':
            n = 'boot' if h < 0.30 else 'skin'
        elif key == 'head':
            if ((x - 0.036) / 0.034) ** 2 + ((h - 1.398) / 0.04) ** 2 < 1 and f > 0.04: n = 'scar'
            elif h < 1.335: n = 'skin'
            elif f > 0.035 and h < 1.455 and ax < 0.075: n = 'skin'
            else: n = 'hair'
        elif key.startswith('eye'): n = 'eye'
        p.material_index = IDX[n]; p.use_smooth = True
for key, (ob, _) in objs.items(): paint(key, ob)

# --- split every mesh into one piece per material, then decimate each piece (clean region borders) ---
def sel(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
pieces = []   # (object, key)
for key, (ob, budget) in objs.items():
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    ratio = 1.0 if key.startswith('eye') else min(1.0, budget / tris)
    sel(ob); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
    parts = [o for o in bpy.context.selected_objects]
    for o in parts:
        if ratio < 1.0 and len(o.data.polygons) > 60:
            d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = ratio
            sel(o); bpy.ops.object.modifier_apply(modifier='dec')
        pieces.append((o, key))
    print(key, tris, '->', sum(len(o.data.polygons) for o in parts), 'pieces', len(parts))

if STATIC:
    bpy.ops.object.select_all(action='DESELECT')
    for ob, _ in pieces: ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_animations=False, export_yup=True)
    print('exported static'); raise SystemExit

# --- skeleton: unparent, bake armature transform (0.01 scale + 90deg) so bones are in meters in world space ---
for ob, _ in pieces: ob.parent = None
arm.parent = None
arm.hide_set(False); arm.hide_viewport = False; arm.hide_select = False
sel(arm); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
arm.animation_data_clear()

# --- weights for non-body meshes: nearest vertex of the body ---
body = srcbody
for ob, key in pieces:
    if key == 'body': continue
    for g in body.vertex_groups: ob.vertex_groups.new(name=g.name)
    dt = ob.modifiers.new('wt', 'DATA_TRANSFER'); dt.object = body; dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'NEAREST'; dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
    sel(ob); bpy.ops.object.modifier_apply(modifier='wt')

# --- merge finger groups into the hand groups (smaller skeleton to deal with) ---
import re
for ob, key in pieces:
    names = [g.name for g in ob.vertex_groups]; acc = []
    for v in ob.data.vertices:
        d = {}
        for g in v.groups:
            n = names[g.group]; t = re.sub(r'(Thumb|Index|Middle|Ring|Pinky)\d$', '', n.replace('HandThumb', 'Hand').replace('HandIndex', 'Hand').replace('HandMiddle', 'Hand').replace('HandRing', 'Hand').replace('HandPinky', 'Hand'))
            t = re.sub(r'Hand\d$', 'Hand', t)
            d[t] = d.get(t, 0) + g.weight
        acc.append(d)
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)
    grp = {}
    for i, d in enumerate(acc):
        tot = sum(d.values()) or 1
        for t, w in d.items():
            if t not in arm.data.bones: continue
            if t not in grp: grp[t] = ob.vertex_groups.new(name=t)
            grp[t].add([i], w / tot, 'REPLACE')

for ob, key in pieces:
    md = ob.modifiers.new('arm', 'ARMATURE'); md.object = arm; md.use_vertex_groups = True
    ob.parent = arm
bpy.ops.object.select_all(action='DESELECT')
for ob, _ in pieces: ob.select_set(True)
arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_animations=False, export_def_bones=True, export_yup=True)
print('exported skinned')
