from base64 import b64encode
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/horse-gallop-sprite.png"
OUTPUT = ROOT / "src/horseFrames.js"
FRAME_WIDTH = 160
FRAME_HEIGHT = 112
PADDING = 7


def encode_frame(source: Image.Image, box: tuple[int, int, int, int]) -> str:
    frame = source.crop(box)
    alpha_box = frame.getchannel("A").getbbox()
    if not alpha_box:
        return ""

    subject = frame.crop(alpha_box)
    available_width = FRAME_WIDTH - PADDING * 2
    available_height = FRAME_HEIGHT - PADDING * 2
    scale = min(
        available_width / subject.width,
        available_height / subject.height,
    )
    size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(size, Image.Resampling.LANCZOS)

    normalized = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT))
    origin = (
        (FRAME_WIDTH - size[0]) // 2,
        (FRAME_HEIGHT - size[1]) // 2,
    )
    normalized.alpha_composite(subject, origin)

    points = bytearray()
    pixels = normalized.load()
    for y in range(FRAME_HEIGHT):
        for x in range(FRAME_WIDTH):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 68:
                continue
            cyan_ratio = green / max(blue, 1)
            if cyan_ratio > 0.78:
                shade = 3
            elif cyan_ratio > 0.54:
                shade = 2
            elif cyan_ratio > 0.30:
                shade = 1
            else:
                shade = 0
            points.extend((x, y, shade))

    return b64encode(points).decode("ascii")


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    width, height = source.size
    x_edges = [round(index * width / 4) for index in range(5)]
    y_edges = [round(index * height / 2) for index in range(3)]

    frames = []
    for row in range(2):
        for column in range(4):
            frames.append(
                encode_frame(
                    source,
                    (
                        x_edges[column],
                        y_edges[row],
                        x_edges[column + 1],
                        y_edges[row + 1],
                    ),
                )
            )

    lines = [
        "// Generated from the approved horse artwork. Do not edit by hand.",
        f"export const HORSE_FRAME_WIDTH = {FRAME_WIDTH};",
        f"export const HORSE_FRAME_HEIGHT = {FRAME_HEIGHT};",
        "export const HORSE_FRAMES = [",
        *[f'  "{frame}",' for frame in frames],
        "];",
        "",
    ]
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
