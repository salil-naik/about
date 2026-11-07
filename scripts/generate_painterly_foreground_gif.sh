#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
source_image="$root/public/life/painterly-flowers.png"
output_image="$root/public/life/painterly-flowers-breeze.gif"

# The x-map bends the painted stems increasingly toward their tips. The time
# terms complete whole cycles, so the GIF loops without a visible reset.
shift='48*(1-Y/H)*(0.65*sin(2*PI*T/6+4*X/W)+0.35*sin(4*PI*T/6-7*X/W))'
warp="r='r(X-$shift\,Y)':g='g(X-$shift\,Y)':b='b(X-$shift\,Y)':a='alpha(X-$shift\,Y)'"

ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -framerate 12 -t 6 -i "$source_image" \
  -filter_complex "[0:v]format=gbrap,geq=$warp,format=rgba,split[for_palette][for_gif];[for_palette]palettegen=reserve_transparent=1[p];[for_gif][p]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=64" \
  -frames:v 72 -loop 0 "$output_image"
