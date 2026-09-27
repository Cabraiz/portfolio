from __future__ import annotations

from math import cos, pi, sin
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets" / "Mateus" / "services"
SOURCE_ANIMATION = ASSETS / "services-sign-lag-arthur-repair-47frames-v15.webp"
RAPPEL_POSES = ASSETS / "lag-arthur-rappel-poses-v1.png"
REPAIR_POSES = ASSETS / "lag-arthur-repair-poses-v1.png"
OUTPUT = ASSETS / "services-sign-lag-arthur-roving-repair-104frames-v17.webp"

CANVAS_SIZE = (1280, 716)
LEFT_BULB = (380, 389)
RIGHT_BULB = (966, 385)
RAPPEL_ANCHOR_X = 640
RAPPEL_HEIGHT = 190
WALK_HEIGHT = 180
REPAIR_HEIGHT = 190
REPAIR_TOOL_TIP_SOURCE = (563, 660)


def animated_frame(source: Image.Image, index: int) -> Image.Image:
    source.seek(index)
    return source.convert("RGBA").copy()


def crop_pose(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    pose = sheet.crop(box)
    alpha_box = pose.getchannel("A").getbbox()
    if alpha_box is None:
        raise RuntimeError(f"Pose crop {box} has no visible pixels")
    return pose.crop(alpha_box)


def resize_to_height(pose: Image.Image, height: int) -> Image.Image:
    width = round(pose.width * height / pose.height)
    return pose.resize((width, height), Image.Resampling.LANCZOS)


def ease_in_out(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return 0.5 - 0.5 * cos(pi * value)


def lerp(start: float, end: float, value: float) -> float:
    return start + (end - start) * value


def rim_baseline(center_x: float) -> int:
    normalized = (center_x - 640) / 520
    return round(399 + 14 * normalized * normalized)


def add_shadow(frame: Image.Image, center_x: int, baseline_y: int, width: int) -> None:
    shadow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse(
        (
            center_x - width // 2,
            baseline_y - 8,
            center_x + width // 2,
            baseline_y + 7,
        ),
        fill=(0, 0, 0, 105),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    frame.alpha_composite(shadow)


def composite_walker(
    background: Image.Image,
    pose: Image.Image,
    *,
    center_x: float,
    direction: int,
    phase: int,
) -> Image.Image:
    frame = background.copy()
    rendered = pose if direction >= 0 else pose.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    bob = (0, -3, -5, -2)[phase % 4]
    baseline = rim_baseline(center_x)
    x = round(center_x - rendered.width / 2)
    y = baseline - rendered.height + bob
    add_shadow(frame, round(center_x), baseline, round(rendered.width * 0.62))
    frame.alpha_composite(rendered, (x, y))
    return frame


def composite_rappel(
    background: Image.Image,
    pose: Image.Image,
    *,
    rope_ratio: float,
    y: int,
) -> Image.Image:
    frame = background.copy()
    rope_x_in_pose = round(pose.width * rope_ratio)
    x = RAPPEL_ANCHOR_X - rope_x_in_pose

    rope_layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(rope_layer)
    rope_end = max(0, y + 16)
    if rope_end > 0:
        draw.line(
            (RAPPEL_ANCHOR_X + 2, 0, RAPPEL_ANCHOR_X + 2, rope_end),
            fill=(0, 0, 0, 125),
            width=7,
        )
        draw.line(
            (RAPPEL_ANCHOR_X, 0, RAPPEL_ANCHOR_X, rope_end),
            fill=(24, 20, 17, 255),
            width=5,
        )
        draw.line(
            (RAPPEL_ANCHOR_X - 1, 0, RAPPEL_ANCHOR_X - 1, rope_end),
            fill=(87, 73, 56, 155),
            width=1,
        )
    frame.alpha_composite(rope_layer)
    frame.alpha_composite(pose, (x, y))
    return frame


def radial_mask(
    size: tuple[int, int],
    center: tuple[int, int],
    radius: float,
    feather: float,
) -> Image.Image:
    width, height = size
    mask = Image.new("L", size, 0)
    pixels = mask.load()
    cx, cy = center
    inner = max(0.0, radius - feather)
    outer = radius + feather
    for y in range(height):
        for x in range(width):
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if distance <= inner:
                value = 255
            elif distance >= outer:
                value = 0
            else:
                value = round(255 * (outer - distance) / max(1.0, outer - inner))
            pixels[x, y] = value
    return mask


def restored_sign(
    dark: Image.Image,
    healthy: Image.Image,
    *,
    left_amount: float = 0.0,
    right_amount: float = 0.0,
    wave_amount: float = 0.0,
) -> Image.Image:
    masks: list[Image.Image] = []
    if left_amount > 0:
        mask = radial_mask(dark.size, LEFT_BULB, 42 + 22 * left_amount, 28)
        masks.append(mask.point(lambda value: round(value * left_amount)))
    if right_amount > 0:
        mask = radial_mask(dark.size, RIGHT_BULB, 42 + 22 * right_amount, 28)
        masks.append(mask.point(lambda value: round(value * right_amount)))
    if wave_amount > 0:
        diagonal = (dark.width**2 + dark.height**2) ** 0.5
        radius = 55 + diagonal * ease_in_out(wave_amount)
        masks.append(radial_mask(dark.size, RIGHT_BULB, radius, 95))

    if not masks:
        return dark.copy()

    combined = Image.new("L", dark.size, 0)
    for mask in masks:
        combined = ImageChops.lighter(combined, mask)
    return Image.composite(healthy, dark, combined)


def add_contact_sparks(
    frame: Image.Image,
    point: tuple[int, int],
    intensity: float,
    phase: int,
) -> None:
    if intensity <= 0:
        return
    cx, cy = point
    glow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = round(13 + 10 * intensity)
    glow_draw.ellipse(
        (cx - glow_radius, cy - glow_radius, cx + glow_radius, cy + glow_radius),
        fill=(255, 145, 28, round(65 * intensity)),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    frame.alpha_composite(glow)

    sparks = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(sparks)
    draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=(255, 247, 196, 255))
    angles = (-1.35, -0.72, -0.18, 0.42, 1.02, 2.45)
    for index, angle in enumerate(angles):
        length = (9 + ((phase + index * 3) % 8)) * intensity
        ex = round(cx + cos(angle) * length)
        ey = round(cy + sin(angle) * length)
        draw.line((cx, cy, ex, ey), fill=(255, 194, 74, round(235 * intensity)), width=2)
    frame.alpha_composite(sparks)


def composite_repair(
    background: Image.Image,
    pose: Image.Image,
    *,
    target: tuple[int, int],
    phase: int,
    spark_intensity: float,
) -> Image.Image:
    frame = background.copy()
    scale = REPAIR_HEIGHT / 735
    tool_x = round(REPAIR_TOOL_TIP_SOURCE[0] * scale)
    tool_y = round(REPAIR_TOOL_TIP_SOURCE[1] * scale)
    angle = (0.0, -1.6, 0.0, 1.3)[phase % 4]
    rendered = pose.rotate(
        angle,
        resample=Image.Resampling.BICUBIC,
        center=(tool_x, tool_y),
        expand=False,
    )
    micro_shift = (0, -1, 0, 1)[phase % 4]
    x = target[0] - tool_x + micro_shift
    y = target[1] - tool_y
    add_shadow(frame, x + rendered.width // 2, y + rendered.height, round(rendered.width * 0.56))
    frame.alpha_composite(rendered, (x, y))
    add_contact_sparks(frame, (target[0] + micro_shift, target[1]), spark_intensity, phase)
    return frame


def add_frames(
    frames: list[Image.Image],
    durations: list[int],
    items: Iterable[Image.Image],
    duration: int,
) -> None:
    for item in items:
        frames.append(item)
        durations.append(duration)


def main() -> None:
    source = Image.open(SOURCE_ANIMATION)
    healthy = animated_frame(source, 0)
    dark = animated_frame(source, 13)
    idle = [animated_frame(source, index) for index in range(6)]
    failure = [animated_frame(source, index) for index in range(6, 14)]

    rappel_sheet = Image.open(RAPPEL_POSES).convert("RGBA")
    rappel_boxes = ((0, 0, 685, 765), (685, 0, 1371, 765), (1371, 0, 2056, 765))
    descent_pose, _, ascent_pose = [
        resize_to_height(crop_pose(rappel_sheet, box), RAPPEL_HEIGHT)
        for box in rappel_boxes
    ]

    repair_sheet = Image.open(REPAIR_POSES).convert("RGBA")
    repair_boxes = ((0, 0, 685, 765), (685, 0, 1370, 765), (1370, 0, 2055, 765))
    walk_pose = resize_to_height(crop_pose(repair_sheet, repair_boxes[0]), WALK_HEIGHT)
    repair_pose = resize_to_height(crop_pose(repair_sheet, repair_boxes[2]), REPAIR_HEIGHT)

    frames: list[Image.Image] = []
    durations: list[int] = []

    # Quiet illuminated idle before the two-point maintenance sequence.
    add_frames(frames, durations, idle, 850)
    add_frames(frames, durations, failure, 125)

    descent_y = (-175, -125, -78, -35, 8, 54, 102, 150, 205)
    add_frames(
        frames,
        durations,
        (
            composite_rappel(dark, descent_pose, rope_ratio=0.564, y=y)
            for y in descent_y
        ),
        145,
    )

    left_center = 318
    right_center = 904

    # Walk from the central rope toward the left bulb with visible intermediate steps.
    for index in range(11):
        amount = ease_in_out(index / 10)
        center_x = lerp(640, left_center, amount)
        frames.append(
            composite_walker(dark, walk_pose, center_x=center_x, direction=-1, phase=index)
        )
        durations.append(165)

    # Repair the left lamp slowly. The lamp brightens only where the tool touches it.
    left_levels = (0.0, 0.08, 0.18, 0.3, 0.44, 0.58, 0.72, 0.84, 0.94, 1.0, 1.0, 1.0)
    for index, level in enumerate(left_levels):
        sign = restored_sign(dark, healthy, left_amount=level)
        spark = (0.0, 0.15, 0.8, 0.28, 1.0, 0.35, 0.9, 0.42, 0.72, 0.25, 0.0, 0.0)[index]
        frames.append(
            composite_repair(
                sign,
                repair_pose,
                target=LEFT_BULB,
                phase=index,
                spark_intensity=spark,
            )
        )
        durations.append(190)

    left_fixed = restored_sign(dark, healthy, left_amount=1.0)

    # Cross the full sign to the right instead of jumping to the next repair point.
    for index in range(19):
        amount = ease_in_out(index / 18)
        center_x = lerp(left_center, right_center, amount)
        frames.append(
            composite_walker(
                left_fixed,
                walk_pose,
                center_x=center_x,
                direction=1,
                phase=index,
            )
        )
        durations.append(165)

    # Repair the right lamp; the successful contact releases a gradual light wave.
    right_levels = (0.0, 0.06, 0.14, 0.25, 0.4, 0.56, 0.7, 0.82, 0.92, 1.0)
    for index, level in enumerate(right_levels):
        sign = restored_sign(dark, healthy, left_amount=1.0, right_amount=level)
        spark = (0.0, 0.2, 0.9, 0.32, 1.0, 0.38, 0.82, 0.45, 0.65, 0.15)[index]
        frames.append(
            composite_repair(
                sign,
                repair_pose,
                target=RIGHT_BULB,
                phase=index,
                spark_intensity=spark,
            )
        )
        durations.append(190)

    for index in range(10):
        amount = (index + 1) / 10
        sign = restored_sign(
            dark,
            healthy,
            left_amount=1.0,
            right_amount=1.0,
            wave_amount=amount,
        )
        frames.append(
            composite_repair(
                sign,
                repair_pose,
                target=RIGHT_BULB,
                phase=index + len(right_levels),
                spark_intensity=max(0.0, 0.55 - amount * 0.5),
            )
        )
        durations.append(185)

    # Return to the central rope before leaving the scene.
    for index in range(10):
        amount = ease_in_out(index / 9)
        center_x = lerp(right_center, 640, amount)
        frames.append(
            composite_walker(
                healthy,
                walk_pose,
                center_x=center_x,
                direction=-1,
                phase=index,
            )
        )
        durations.append(165)

    ascent_y = (205, 162, 116, 68, 20, -34, -96, -170)
    add_frames(
        frames,
        durations,
        (
            composite_rappel(healthy, ascent_pose, rope_ratio=0.662, y=y)
            for y in ascent_y
        ),
        145,
    )

    frames.append(healthy.copy())
    durations.append(960)

    if len(frames) != 104:
        raise RuntimeError(f"Unexpected frame count: {len(frames)}")

    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        format="WEBP",
        quality=90,
        method=4,
        minimize_size=False,
        lossless=False,
    )

    print(f"Wrote {OUTPUT}")
    print(f"Frames: {len(frames)}")
    print(f"Loop: {sum(durations)} ms")


if __name__ == "__main__":
    main()
