# About me

Built with React, Vite, TypeScript, and Tailwind CSS.

```sh
npm install
npm run dev
```

The development server runs at [http://127.0.0.1:3000](http://127.0.0.1:3000).

```sh
npm run build
npm start
```

Available pages: `/`, `/thoughts`, `/life`, and `/starship`.

The Starship Flight Atlas lives in `starship/` and has its own HTML entry. Its 3D code and styles load only on `/starship`.

`/life` is the interactive Painterly world.

Regenerate its animated foreground with `bash scripts/generate_painterly_foreground_gif.sh` and its nature audio with `python3 scripts/generate_painterly_ambience.py`.
