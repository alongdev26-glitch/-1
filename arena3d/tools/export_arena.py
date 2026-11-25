import bpy, sys
bpy.ops.wm.open_mainfile(filepath=sys.argv[-2])
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
for m in bpy.data.materials:
    if not m.use_nodes: continue
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    if not bsdf: continue
    bc = bsdf.inputs['Base Color']
    if bc.is_linked:
        val = bc.default_value[:]
        for l in list(bc.links): m.node_tree.links.remove(l)
        bc.default_value = val
    if m.name == 'Material.001': bc.default_value = (0.55,0.55,0.55,1)
col = bpy.data.collections.new('exp'); bpy.context.scene.collection.children.link(col)
for o in list(bpy.data.objects):
    if o.type != 'MESH': continue
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False)
    me.transform(o.matrix_world)
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(o.name+'_s', me); col.objects.link(ob)
    print(o.name, len(me.polygons))
bpy.ops.object.select_all(action='DESELECT')
for ob in col.objects: ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=sys.argv[-1], export_format='GLB', use_selection=True, export_animations=False)
