# Cosmética Natural

Base inicial de una tienda web estática de cosmética natural, construida con HTML5, CSS3 y JavaScript Vanilla. No requiere compilación, backend ni dependencias de producción.

## Estructura

- `index.html`: página de inicio con espacios reservados para las futuras secciones.
- `productos.html`: catálogo que carga los datos de prueba de forma dinámica.
- `producto.html`: base para el futuro detalle de un producto.
- `nosotros.html`: base para presentar la marca.
- `contacto.html`: base para la información de contacto.
- `css/styles.css`: estilos globales, estructura y componentes básicos.
- `css/responsive.css`: ajustes para pantallas pequeñas.
- `js/main.js`: comportamiento común a todas las páginas.
- `js/productos.js`: carga y representación del catálogo de prueba.
- `data/productos.json`: tres productos ficticios para desarrollo.
- `assets/`: carpetas preparadas para imágenes, productos, iconos y logotipo locales.

## Uso local

Para que la carga de `productos.json` funcione, se debe servir el proyecto mediante un servidor HTTP local en lugar de abrir los archivos directamente. Por ejemplo, con Python:

```bash
python3 -m http.server 8000
```

Luego se puede visitar `http://localhost:8000`. En un hosting web tradicional basta con subir todo el contenido manteniendo la estructura de carpetas.
