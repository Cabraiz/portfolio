import bpy, sys, math
from mathutils import Vector
src, out, res = sys.argv[1], sys.argv[2], int(sys.argv[3])
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
bpy.ops.wm.open_mainfile(filepath=src, load_ui=False, use_scripts=False)
scene = bpy.context.scene
# remove everything except the plane meshes
for o in list(bpy.data.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']

def principled(name, color, rough=0.35, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if "Coat Weight" in b.inputs: b.inputs["Coat Weight"].default_value = coat
    return m, b

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)

# bounds (world) of the body to build a procedural paint mask
body = bpy.data.objects["Body"]
zs = [ (body.matrix_world @ v.co).z for v in body.data.vertices ]
zmax, zmin = max(zs), min(zs)

# Paint: white fuselage/wings, teal tail fin (highest part of the body)
paint = bpy.data.materials.new("Paint"); paint.use_nodes = True
nt = paint.node_tree; nodes = nt.nodes; links = nt.links
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.32
if "Coat Weight" in bsdf.inputs: bsdf.inputs["Coat Weight"].default_value = 0.35
coord = nodes.new("ShaderNodeTexCoord"); sep = nodes.new("ShaderNodeSeparateXYZ")
links.new(coord.outputs["Object"], sep.inputs[0])
# fin (highest part) -> teal; wings/tailplane (|y| beyond the fuselage) -> light grey; fuselage -> white
finm = nodes.new("ShaderNodeMapRange")
finm.inputs["From Min"].default_value = zmin + (zmax - zmin) * 0.50
finm.inputs["From Max"].default_value = zmin + (zmax - zmin) * 0.52
links.new(sep.outputs["Z"], finm.inputs["Value"])
absy = nodes.new("ShaderNodeMath"); absy.operation = 'ABSOLUTE'; links.new(sep.outputs["Y"], absy.inputs[0])
wingm = nodes.new("ShaderNodeMapRange")
wingm.inputs["From Min"].default_value = 0.98; wingm.inputs["From Max"].default_value = 1.06
links.new(absy.outputs[0], wingm.inputs["Value"])
white = nodes.new("ShaderNodeRGB"); white.outputs[0].default_value = (*srgb("#f7f8f6"), 1)
grey = nodes.new("ShaderNodeRGB"); grey.outputs[0].default_value = (*srgb("#b9c3c3"), 1)
teal = nodes.new("ShaderNodeRGB"); teal.outputs[0].default_value = (*srgb("#075c59"), 1)
mix1 = nodes.new("ShaderNodeMix"); mix1.data_type = 'RGBA'
links.new(wingm.outputs["Result"], mix1.inputs[0]); links.new(white.outputs[0], mix1.inputs[6]); links.new(grey.outputs[0], mix1.inputs[7])
mix2 = nodes.new("ShaderNodeMix"); mix2.data_type = 'RGBA'
links.new(finm.outputs["Result"], mix2.inputs[0]); links.new(mix1.outputs[2], mix2.inputs[6]); links.new(teal.outputs[0], mix2.inputs[7])
ramp = mix2
links.new(mix2.outputs[2], bsdf.inputs["Base Color"])

engine, _ = principled("EngineMat", srgb("#0a6b66"), rough=0.3, metal=0.35, coat=0.4)
dark, _ = principled("Dark", srgb("#1d2427"), rough=0.5)
for o in meshes:
    for i, slot in enumerate(o.material_slots):
        n = (slot.material.name if slot.material else "")
        if o.name == "Body": slot.material = paint
        elif n in ("EngineInterior", "Tyre", "Hub"): slot.material = dark
        else: slot.material = engine

# center everything at origin
mins = Vector((1e9,)*3); maxs = Vector((-1e9,)*3)
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); mins = Vector(map(min, mins, w)); maxs = Vector(map(max, maxs, w))
center = (mins + maxs) / 2; size = maxs - mins
print("bounds", tuple(round(v,2) for v in mins), tuple(round(v,2) for v in maxs))
for o in meshes: o.location -= center

cam_data = bpy.data.cameras.new("Cam"); cam_data.type = 'ORTHO'; cam_data.ortho_scale = max(size.x, size.y) * 1.06
cam = bpy.data.objects.new("Cam", cam_data); scene.collection.objects.link(cam)
cam.location = (0, 0, 40); cam.rotation_euler = (0, 0, 0)
scene.camera = cam

sun_data = bpy.data.lights.new("Sun", 'SUN'); sun_data.energy = 3.4; sun_data.angle = math.radians(8)
sun = bpy.data.objects.new("Sun", sun_data); scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(38), math.radians(-30), math.radians(-35))
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (*srgb("#dfe9e4"), 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 96
try: scene.cycles.use_denoising = True
except Exception: pass
scene.render.film_transparent = True
scene.render.resolution_x = res; scene.render.resolution_y = res; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
try: scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
scene.view_settings.exposure = 0.35
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("done", out)
