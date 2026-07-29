# Обогащение базы йодом

Источник значений: **USDA, FDA and ODS-NIH Database for the Iodine Content of Common Foods, Release 4 (2024)** (mcg/100 g),
плюс точечные оценки для продуктов без прямого соответствия (отмечены в таблице).

- Добавлено новых записей `info` (йод): **97**
- Обновлено существующих записей йода: **2**
- Новые продукты: **2** (`1249` йодированная соль, `1250` нори сушёные)

## Добавлено

| product_id | Продукт | I mcg/100g | Источник |
|---|---|---:|---|
| 1097 | Соль поваренная пищевая | 4000.0 | RU iodized table salt ~40 mcg/g (типичная поваренная йодированная) |
| 982 | Лавер, морские водоросли | 2316.7 | USDA R4: Nori, seaweed, dried |
| 981 | Келп, морские водоросли | 1500.0 | estimate dried kelp/kombu (литература; в USDA R4 нет kelp iodine) |
| 979 | Вакаме, морские водоросли | 42.0 | approx USDA SR wakame raw order |
| 980 | Ирландский мох, морские водоросли | 47.0 | estimate Irish moss / carrageen |
| 983 | Спирулина, морские водоросли | 15.0 | estimate spirulina dried (low) |
| 977 | Агар-агар, морские водоросли, сухие | 20.0 | estimate agar dry (low after processing) |
| 978 | Агар-агар, морские водоросли | 8.0 | estimate agar wet |
| 747 | Устрицы восточные, вареные | 109.1 | USDA R4: oyster eastern cooked |
| 748 | Устрицы восточные запеченные | 109.1 | USDA R4: oyster eastern cooked |
| 751 | Устрицы тихоокеанские, вареные | 109.1 | USDA R4 proxy: oyster cooked |
| 749 | Устрицы восточные | 80.0 | estimate oyster raw (между cooked USDA и лит.) |
| 750 | Устрицы восточные, консервированные | 70.0 | estimate oyster canned |
| 752 | Устрицы тихоокеанские | 80.0 | estimate Pacific oyster raw |
| 738 | Мидии голубые вареные | 100.0 | estimate mussels cooked (лит./EU tables) |
| 730 | Мидии | 60.0 | estimate mussels raw |
| 739 | Мидии голубые | 60.0 | estimate blue mussels raw |
| 754 | Омар | 185.0 | USDA R4: lobster cooked |
| 753 | Лангуст | 120.0 | estimate langoustine / lobster-like |
| 192 | Яйцо куриное отварное | 61.0 | USDA R4: eggs hard-boiled |
| 194 | Яйцо перепелиное, целое | 40.0 | estimate quail egg |
| 195 | Яйцо утиное, цельное | 50.0 | estimate duck egg |
| 237 | Молоко пастеризованное, 0.05% | 34.2 | USDA R4: milk skim |
| 242 | Молоко питьевое, обезжиренное | 34.2 | USDA R4: milk skim |
| 241 | Молоко питьевое, 1% | 36.1 | USDA R4: milk 1% |
| 238 | Молоко пастеризованное, 1.5% | 36.1 | USDA R4: milk 1% |
| 239 | Молоко пастеризованное, 2.5% | 35.8 | USDA R4: milk 2% |
| 240 | Молоко пастеризованное, 3.5% | 33.5 | USDA R4: milk whole |
| 257 | Молоко цельное, 3.25% | 33.5 | USDA R4: milk whole |
| 202 | Йогурт, 1.5% | 40.0 | USDA R4 order: yogurt plain ~32-59 |
| 203 | Йогурт, 3.2% | 40.0 | USDA R4 order: yogurt plain |
| 204 | Йогурт, 6.0% | 40.0 | USDA R4 order: yogurt plain |
| 205 | Йогурт ванильный, 1.25% | 35.0 | USDA R4 order: flavored yogurt |
| 206 | Йогурт плодово-ягодный, 1.5% | 35.0 | USDA R4 order: fruit yogurt |
| 207 | Йогурт с ванильным вкусом, 0.2% | 35.0 | USDA R4 order: flavored yogurt |
| 208 | Йогурт с лимонным вкусом, 0.2% | 35.0 | USDA R4 order: flavored yogurt |
| 209 | Йогурт сладкий, 3.2% | 40.0 | USDA R4 order: yogurt |
| 210 | Йогурт сладкий, 6.0% | 40.0 | USDA R4 order: yogurt |
| 211 | Йогурт фруктовый, 1.4% | 35.0 | USDA R4 order: fruit yogurt |
| 212 | Йогурт шоколадный из обезжиренного молока | 35.0 | USDA R4 order: flavored yogurt |
| 213 | Кефир, 1% | 30.0 | estimate kefir ~ dairy |
| 214 | Кефир, 2.5% | 30.0 | estimate kefir |
| 216 | Кефир нежирный, 0.05% | 28.0 | estimate kefir lowfat |
| 284 | Простокваша, 1% | 28.0 | estimate prostokvasha |
| 285 | Простокваша, 2.5% | 28.0 | estimate prostokvasha |
| 287 | Простокваша нежирная, 0.05% | 26.0 | estimate prostokvasha nonfat |
| 383 | Сыр «Чеддер» | 45.9 | USDA R4: cheddar |
| 338 | Сыр чеддер маложирный | 45.9 | USDA R4: cheddar lowfat proxy |
| 384 | Сыр швейцарский | 137.3 | USDA R4: Swiss |
| 385 | Сыр швейцарский маложирный | 59.9 | USDA R4: Swiss low fat processed |
| 386 | Сыр швейцарский твердый | 137.3 | USDA R4: Swiss |
| 388 | Сыр «Эмментальский» | 137.3 | USDA R4 proxy Emmental/Swiss |
| 344 | Сыр моцарелла, 16% | 51.0 | USDA R4: mozzarella |
| 345 | Сыр моцарелла, 20% | 51.0 | USDA R4: mozzarella |
| 346 | Сыр моцарелла из цельного молока, 22% | 51.0 | USDA R4: mozzarella |
| 347 | Сыр моцарелла из цельного молока, 25% | 51.0 | USDA R4: mozzarella |
| 348 | Сыр моцарелла, обезжиренный | 51.0 | USDA R4: mozzarella |
| 353 | Сыр пармезан, 27% | 82.4 | USDA R4: parmesan grated |
| 354 | Сыр пармезан сухой тертый, 20% | 82.4 | USDA R4: parmesan |
| 355 | Сыр пармезан твердый, 26% | 82.4 | USDA R4: parmesan |
| 356 | Сыр пармезан тертый, 29% | 82.4 | USDA R4: parmesan |
| 381 | Сыр фета | 48.4 | USDA R4: feta |
| 362 | Сыр рикотта, 8% | 66.0 | USDA R4: ricotta |
| 363 | Сыр рикотта из цельного молока, 13% | 66.0 | USDA R4: ricotta whole |
| 360 | Сыр проволоне, 27% | 64.3 | USDA R4: provolone |
| 361 | Сыр проволоне, 18% | 64.3 | USDA R4: provolone |
| 342 | Сыр монтерей, 30% | 40.0 | USDA R4: Monterey Jack |
| 343 | Сыр монтерей маложирный | 40.0 | USDA R4: Monterey Jack |
| 333 | Сыр «Колбасный», плавленный | 56.7 | USDA R4: American processed proxy for sausage cheese |
| 329 | Сыр «Золушка» плавленный | 56.7 | USDA R4: processed cheese proxy |
| 339 | Сыр «Медовый» плавленный | 56.7 | USDA R4: processed cheese proxy |
| 351 | Сыр «Мятный» плавленный, 19.1% | 56.7 | USDA R4: processed cheese proxy |
| 367 | Сыр «Российский» плавленный | 56.7 | USDA R4: processed cheese proxy |
| 371 | Сыр «Сказка» плавленный | 56.7 | USDA R4: processed cheese proxy |
| 372 | Сыр «Сластена» плавленный | 56.7 | USDA R4: processed cheese proxy |
| 692 | Треска запеченная | 172.1 | USDA R4: cod baked |
| 697 | Треска тихоокеанская запеченная | 172.1 | USDA R4: cod baked |
| 694 | Треска отварная | 150.0 | estimate boiled cod ~ raw/baked USDA |
| 691 | Треска жареная | 140.0 | estimate fried cod |
| 696 | Треска тушеная | 140.0 | estimate stewed cod |
| 690 | Треска горячего копчения | 120.0 | estimate smoked cod |
| 693 | Треска копченая в масле, консервы | 100.0 | estimate canned smoked cod in oil |
| 695 | Треска соленая | 110.0 | estimate salted cod |
| 698 | Треска тихоокеанская | 130.6 | USDA R4: Pacific cod raw |
| 631 | Пикша запеченная | 200.0 | USDA R4 haddock raw 227 → baked estimate |
| 632 | Пикша копченая | 180.0 | estimate smoked haddock |
| 714 | Хек припущенный | 140.0 | estimate hake poached |
| 724 | Креветка антарктическая, варено-мороженая | 15.0 | USDA R4: shrimp precooked ~15 |
| 725 | Креветка антарктическая, консервы | 14.0 | USDA R4: shrimp raw order |
| 726 | Креветка антарктическая, варено-мороженая | 15.0 | USDA R4: shrimp precooked |
| 704 | Тунец в масле, консервы | 8.7 | USDA R4: tuna canned water |
| 705 | Тунец натуральный, консервы | 8.7 | USDA R4: tuna canned |
| 700 | Тунец желтоперый, запеченный | 23.0 | USDA R4: tuna cooked dry heat |
| 702 | Тунец полосатый запеченный | 23.0 | USDA R4: tuna cooked |
| 629 | Печень трески, консервы | 250.0 | estimate canned cod liver (лит., высоковариативно) |
| 1249 | Соль поваренная йодированная | 5213.1 | USDA R4: Salt, table, iodized |
| 1250 | Нори, морские водоросли сушёные | 2316.7 | USDA R4: Nori, seaweed, dried |

## Обновлено

| product_id | Продукт | было | стало | Источник |
|---|---|---:|---:|---|
| 187 | Желток сухой | 115.0 | 349.3 | USDA R4: egg yolk dried (upgrade) |
| 191 | Яичный порошок | 64.0 | 274.4 | USDA R4: egg whole dried (if product exists as powder) |

## Остающиеся дыры (не трогали в этом проходе)

- Микроэлементы с покрытием <15%: ванадий, кремний, бор, витамин B3/H/D, хром, фтор, кобальт, молибден, сера, хлор — нужны отдельные источники.
- Полный импорт USDA FoodData Central не делался (другие имена продуктов, объём).

