# ♞ LeoChess

Шаховий тренажер для дітей і юнаків: дебюти, плани в мітельшпілі, класичні партії
і вільний аналіз варіантів зі Stockfish прямо в браузері. Усе працює на одній сторінці,
без сервера й без реєстрації. Інтерфейс — українською.

## Що вміє

- **Перегляд** — дебютні лінії з коментарями до ключових ходів і планом для білих і чорних.
- **Тренування** — граєш за свою сторону, суперник відповідає за лінією; підказки, прогрес.
- **Мітельшпіль** — продовження кожної лінії з завданнями «знайди хід за планом».
- **Аналіз** — вільні ходи за обидві сторони, дерево варіантів, оцінка Stockfish 19,
  позначки `?!` `?` `??` і пояснення помилок простими словами.
- **Розділи**: іспанська, італійська, Каро-Канн, партії Морфі, атакуючі мініатюри.
- **Тренер-леопард** реагує мімікою на ходи; теми фігур: класика, леопард, самоцвіти,
  лисиці, рись, панди, вовки.

## Швидкий старт

```bash
pip install -r requirements.txt
python3 scripts/build.py          # → dist/index.html
open dist/index.html              # або просто відкрий файл у браузері
```

Після зміни лише HTML/CSS/JS: `python3 scripts/build.py --page` (швидше).

## Тести

```bash
python -m playwright install chromium
tests/run_all.sh
```

## Публікація

Кожен push у `main` збирає сторінку і публікує її на GitHub Pages
(workflow `.github/workflows/pages.yml`). Увімкни Pages: **Settings → Pages → Source: GitHub Actions**.

## Структура

```
src/            сторінка: index.html (розмітка з плейсхолдерами), styles.css, app.js, coach.svg
data/           контент: дебюти, мітельшпіль, партії Морфі, мініатюри (Python-модулі)
scripts/        збирання: build.py, build_data.py, build_pieces.py, build_coach.py, piece_art.py
assets/pieces/  класичні фігури cburnett (SVG)
vendor/         chess.js, Stockfish 19 lite (wasm), Stockfish 10 (asm.js)
tests/          браузерні тести (Playwright)
tools/          перевірка контенту рушієм (потрібен локальний stockfish)
```

Ліцензія — GPL v3 (див. `LICENSE` і `THIRD_PARTY.md`).
