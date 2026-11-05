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

# Paint (object coordinates of the Body mesh; nose at +X, fin up +Z):
# white glossy fuselage with a teal dorsal stripe, teal fin and tailplane,
# light blue-grey wings with amber wingtips and a dark cockpit windshield.
paint = bpy.data.materials.new("Paint"); paint.use_nodes = True
nt = paint.node_tree; nodes = nt.nodes; links = nt.links
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.22
if "Coat Weight" in bsdf.inputs:
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.08
coord = nodes.new("ShaderNodeTexCoord"); sep = nodes.new("ShaderNodeSeparateXYZ")
links.new(coord.outputs["Object"], sep.inputs[0])
absy = nodes.new("ShaderNodeMath"); absy.operation = 'ABSOLUTE'; links.new(sep.outputs["Y"], absy.inputs[0])
X, Y, Z = sep.outputs["X"], absy.outputs[0], sep.outputs["Z"]

def step(sock, edge, above=True, eps=0.03):
    m = nodes.new("ShaderNodeMapRange")
    m.inputs["From Min"].default_value = edge - eps; m.inputs["From Max"].default_value = edge + eps
    if not above:
        m.inputs["To Min"].default_value = 1.0; m.inputs["To Max"].default_value = 0.0
    links.new(sock, m.inputs["Value"]); return m.outputs["Result"]

def mul(*socks):
    out = socks[0]
    for s2 in socks[1:]:
        m = nodes.new("ShaderNodeMath"); m.operation = 'MULTIPLY'
        links.new(out, m.inputs[0]); links.new(s2, m.inputs[1]); out = m.outputs[0]
    return out

def rgb(hexc):
    n = nodes.new("ShaderNodeRGB"); n.outputs[0].default_value = (*srgb(hexc), 1); return n.outputs[0]

def layer(base, color, mask):
    m = nodes.new("ShaderNodeMix"); m.data_type = 'RGBA'
    links.new(mask, m.inputs[0]); links.new(base, m.inputs[6]); links.new(color, m.inputs[7]); return m.outputs[2]

wing_mask = mul(step(Y, 1.02), step(X, -6.6))
tailplane_mask = mul(step(X, -7.1, above=False), step(Y, 1.0), step(Z, 1.15, above=False))
fin_mask = mul(step(Z, 1.15), step(X, -6.0, above=False))
stripe_mask = mul(step(Y, 0.30, above=False), step(Z, 0.5), step(X, 7.4, above=False))
tip_mask = step(Y, 6.55)
cockpit_mask = mul(step(X, 8.05), step(X, 8.75, above=False), step(Z, 0.25), step(Y, 0.62, above=False))

color = rgb("#ffffff")
color = layer(color, rgb("#e6ecef"), wing_mask)
color = layer(color, rgb("#10a497"), stripe_mask)
color = layer(color, rgb("#0a857c"), tailplane_mask)
color = layer(color, rgb("#0a857c"), fin_mask)
color = layer(color, rgb("#ff9a1f"), tip_mask)
color = layer(color, rgb("#11283a"), cockpit_mask)
links.new(color, bsdf.inputs["Base Color"])

engine, _ = principled("EngineMat", srgb("#10a497"), rough=0.25, metal=0.15, coat=0.6)
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

sun_data = bpy.data.lights.new("Sun", 'SUN'); sun_data.energy = 2.2; sun_data.color = (1.0, 0.95, 0.87); sun_data.angle = math.radians(8)
sun = bpy.data.objects.new("Sun", sun_data); scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(38), math.radians(-30), math.radians(-35))
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (*srgb("#cfe2ff"), 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.62

scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 96
try: scene.cycles.use_denoising = True
except Exception: pass
scene.render.film_transparent = True
scene.render.resolution_x = res; scene.render.resolution_y = res; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.exposure = 0.0
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("done", out)
