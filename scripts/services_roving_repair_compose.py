# Helpers de imagem do build-services-roving-repair-animation.py.
from __future__ import annotations

from math import cos, pi

from PIL import Image, ImageDraw, ImageFilter


def light_level(healthy: Image.Image, dark: Image.Image, amount: float) -> Image.Image:
    return Image.blend(dark, healthy, max(0.0, min(1.0, amount)))


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
    # The replacement is intentionally front-facing, so its upper rim stays level.
    return 342


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
