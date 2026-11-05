# Avião da rota do portfólio

`src/assets/Mateus/portfolio/journey-plane-v1.webp` é um render de cima do modelo
**"Jet Airplane"** de OpenGameArt (licença **CC0**, domínio público: pode ser usado
em projetos comerciais, sem atribuição obrigatória):
https://opengameart.org/content/jet-airplane (arquivo `passengerjet_gear_up.blend`,
2.264 triângulos).

A pintura original (companhias aéreas de brincadeira) não é usada: o script troca os
materiais por fuselagem branca, asas cinza-claro, cauda e motores no verde do site.

Para renderizar de novo (Blender como módulo Python, `pip install bpy==5.2.3`):

```sh
python -I scripts/journey-plane/render-plane.py passengerjet_gear_up.blend plane.png 512
```

Depois recortar para 512×408 (y 52–460), reduzir para 200 px de largura e salvar em WebP.
