from PIL import Image, ImageDraw, ImageFont

FELT = (15, 35, 24)        # #0f2318
CREAM = (245, 240, 225)    # card face
GOLD = (201, 168, 76)      # #c9a84c

FONT_PATH = "C:/Windows/Fonts/arialbd.ttf"


def rounded_card(size, fill, outline, outline_width, radius):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [(0, 0), (size[0] - 1, size[1] - 1)],
        radius=radius,
        fill=fill,
        outline=outline,
        width=outline_width,
    )
    return img


def draw_centered_text(draw, center, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text((center[0] - w / 2 - bbox[0], center[1] - h / 2 - bbox[1]), text, font=font, fill=fill)


def make_icon(path, size=1024):
    img = Image.new("RGBA", (size, size), FELT + (255,))
    draw = ImageDraw.Draw(img)

    card_w, card_h = int(size * 0.62), int(size * 0.8)
    card = rounded_card((card_w, card_h), CREAM, GOLD, max(6, size // 60), radius=int(size * 0.06))

    cdraw = ImageDraw.Draw(card)
    suit_font = ImageFont.truetype(FONT_PATH, int(card_h * 0.45))
    draw_centered_text(cdraw, (card_w / 2, card_h / 2), "♠", suit_font, GOLD)

    pip_font = ImageFont.truetype(FONT_PATH, int(card_h * 0.13))
    draw_centered_text(cdraw, (card_w * 0.16, card_h * 0.12), "L", pip_font, GOLD)
    draw_centered_text(cdraw, (card_w * 0.84, card_h * 0.88), "L", pip_font, GOLD)

    img.alpha_composite(card, ((size - card_w) // 2, (size - card_h) // 2))
    img.convert("RGB").save(path)


def make_splash(path, size=2732):
    img = Image.new("RGBA", (size, size), FELT + (255,))
    draw = ImageDraw.Draw(img)

    card_w, card_h = int(size * 0.32), int(size * 0.42)
    card = rounded_card((card_w, card_h), CREAM, GOLD, max(6, size // 120), radius=int(size * 0.03))
    cdraw = ImageDraw.Draw(card)
    suit_font = ImageFont.truetype(FONT_PATH, int(card_h * 0.45))
    draw_centered_text(cdraw, (card_w / 2, card_h / 2), "♠", suit_font, GOLD)

    card_y = int(size * 0.32)
    img.alpha_composite(card, ((size - card_w) // 2, card_y))

    title_font = ImageFont.truetype(FONT_PATH, int(size * 0.11))
    draw_centered_text(draw, (size / 2, card_y + card_h + int(size * 0.1)), "Lora", title_font, GOLD)

    img.convert("RGB").save(path)


make_icon("assets-src/icon.png")
make_splash("assets-src/splash.png")
print("done")
