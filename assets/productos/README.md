# Fotografías de producto

Guardar aquí las fotografías reales con nombres en minúsculas, sin espacios y con guiones. La propiedad `imagen` de cada elemento de `data/productos.json` debe apuntar a esta carpeta. Si el archivo o la propiedad no existen, la card mantiene automáticamente la silueta editorial actual.

## Nombres preparados para el catálogo

- `bruma.jpg`
- `crema-facial.jpg`
- `crema-manos-pies.jpg`
- `crema-corporal.jpg`
- `crema-antiage.jpg`
- `shampoo.jpg`
- `acondicionador.jpg`
- `combo-shampoo-acondicionador.jpg`
- `balsamo.jpg`
- `jabon-carbon-activado.jpg`
- `jabon-coco-lavanda.jpg`
- `jabon-glicerina-geranio.jpg`
- `serum-suave-descongestivo.jpg`
- `serum-hialuronico.jpg`
- `aceite-masajes.jpg`
- `crema-peinar.jpg`
- `espuma-facial.jpg`
- `repelente.jpg`
- `protector-solar.jpg`
- `desodorante.jpg`

## Modelo de datos futuro

```json
{
  "id": 1,
  "slug": "crema-facial",
  "nombre": "Crema facial",
  "categoria": "Facial",
  "descripcion": "Descripción corta",
  "descripcionCompleta": "Descripción completa",
  "precio": null,
  "imagen": "assets/productos/crema-facial.jpg",
  "galeria": [],
  "ingredientes": [],
  "formaDeUso": "",
  "destacado": false,
  "disponible": true
}
```

`precio` permanece en `null` hasta contar con el valor vigente. Este documento no modifica ni sustituye los datos actuales.
