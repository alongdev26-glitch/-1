# Blender: bakes the Toph blend (Rigify) into a skinned, game-ready GLB (rest pose, DEF bones only, flat materials).
# usage: python3 export_toph.py <toph.blend> <out.glb>
import bpy, sys, mathutils
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.open_mainfile(filepath=src)
bpy.context.scene.frame_set(1)
rig = bpy.data.objects['rig']
rig.hide_set(False); rig.hide_viewport = False; rig.hide_select = False
rig.data.pose_position = 'POSE'   # frame-1 pose (eyes look forward); applied as the new rest pose below
bpy.context.view_layer.update()

names = ['Circle','Circle.002','Circle.003','Circle.004','Circle.005','Circle.006','Cube','Cube.001','Cube.002',
         'Cylinder','Cylinder.001','Cylinder.002','Cylinder.003','eyes','eyes.001','new','Plane','Plane.001','ponpon','Sphere']
FLAT = {'skin': (0.80,0.58,0.40,1), 'body skin': (0.80,0.58,0.40,1), 'hair': (0.07,0.045,0.03,1),
        'iris': (0.72,0.82,0.74,1), 'eye in': (0.08,0.08,0.08,1)}
flatmats = {}
for nm, c in FLAT.items():
    mm = bpy.data.materials.new(nm + '_flat'); mm.use_nodes = True
    mm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = c
    mm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.75
    flatmats[nm] = mm

col = bpy.data.collections.new('exp'); bpy.context.scene.collection.children.link(col)
TOTAL = 24000
made = []
for n in names:
    dg = bpy.context.evaluated_depsgraph_get()
    o = bpy.data.objects[n]
    # evaluate everything except the armature deform (armature is in REST pose, so it is identity anyway)
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False)
    me.transform(o.matrix_world)
    for i in range(len(me.materials)):
        m = me.materials[i]
        if m and m.name in flatmats: me.materials[i] = flatmats[m.name]
    ob = bpy.data.objects.new(n + '_s', me); col.objects.link(ob)
    if len(ob.vertex_groups) == 0:
        for vg in o.vertex_groups: ob.vertex_groups.new(name=vg.name)
    for p in me.polygons: p.use_smooth = True
    if n == 'Circle':  # headband: plain green, a bit bigger, a bit lower
        yeshil = bpy.data.materials.get('yeşil')
        for i in range(len(me.materials)):
            if me.materials[i] and me.materials[i].name == 'sarı': me.materials[i] = yeshil
        vs = me.vertices
        c0 = (mathutils.Vector((min(v.co.x for v in vs), min(v.co.y for v in vs), min(v.co.z for v in vs))) +
              mathutils.Vector((max(v.co.x for v in vs), max(v.co.y for v in vs), max(v.co.z for v in vs)))) / 2
        for v in vs: v.co = c0 + (v.co - c0) * 1.14 + mathutils.Vector((0, 0, -0.45))
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    budget = max(80, min(tris, int(TOTAL * (tris / 40000))))
    if n in ('eyes', 'eyes.001'): budget = tris
    if tris > budget:
        d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = budget / max(tris, 1)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier='dec')
    made.append(ob)
    if n == 'eyes': print('EYES idx', set(p.material_index for p in me.polygons), [m.name for m in me.materials])
    print(n, tris, '->', len(me.polygons), 'dvert groups sample', len(me.vertices[0].groups) if len(me.vertices) else 0)

# --- collapse the ~160 Rigify DEF bones to a small game skeleton (face/fingers rigid with head/hand) ---
import re
def target_bone(name):
    if not name.startswith('DEF-') and not name.startswith('basic_eye'): return None
    base = re.sub(r'\.\d+$', '', name)            # drop .001 etc. (twist/segment)
    side = '.L' if base.endswith('.L') else '.R' if base.endswith('.R') else ''
    core = base[:-2] if side else base
    if core in ('DEF-spine', 'DEF-spine.001', 'DEF-spine.002', 'DEF-spine.003', 'DEF-spine.004', 'DEF-spine.005', 'DEF-spine.006'): return name if name in rig.data.bones else core
    if core.startswith('DEF-pelvis'): return 'DEF-spine'
    if core in ('DEF-thigh', 'DEF-shin', 'DEF-foot', 'DEF-toe', 'DEF-shoulder', 'DEF-upper_arm', 'DEF-forearm', 'DEF-hand'): return core + side
    if core.startswith(('DEF-f_', 'DEF-thumb', 'DEF-palm')): return 'DEF-hand' + side
    if core.startswith('DEF-breast'): return 'DEF-spine.003'
    return 'DEF-spine.006'                                  # face, ears, eyes, tongue...
for ob in made:
    me = ob.data
    names_by_idx = [g.name for g in ob.vertex_groups]
    acc = []
    for v in me.vertices:
        d = {}
        for g in v.groups:
            t = target_bone(names_by_idx[g.group])
            if t is None or t not in rig.data.bones: continue
            d[t] = d.get(t, 0) + g.weight
        acc.append(d)
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)
    groups = {}
    for i, d in enumerate(acc):
        tot = sum(d.values()) or 1
        for t, w in d.items():
            if t not in groups: groups[t] = ob.vertex_groups.new(name=t)
            groups[t].add([i], w / tot, 'REPLACE')

# make the evaluated frame-1 pose the armature's rest pose, so skinning bind pose == mesh shape
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
# skin to the rig
for ob in made:
    mod = ob.modifiers.new('arm', 'ARMATURE'); mod.object = rig; mod.use_vertex_groups = True
    ob.parent = rig; ob.parent_type = 'OBJECT'
    print('skin', ob.name, ob.parent.name if ob.parent else None, [m.type for m in ob.modifiers], len(ob.vertex_groups), ob.users_collection[0].name)
print('rig collections', [c.name for c in rig.users_collection], 'rig hide', rig.hide_get() if hasattr(rig,'hide_get') else None, rig.hide_viewport)

bpy.ops.object.select_all(action='DESELECT')
for ob in made: ob.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_animations=False,
                          export_def_bones=True, export_image_format='JPEG', export_yup=True)
print('exported')
