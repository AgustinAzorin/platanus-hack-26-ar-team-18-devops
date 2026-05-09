# scraper_propiedad

Scraper de un clasificado individual de Zonaprop a partir de su `posting_id`.

Abre la ficha publica a partir de una URL generica con el id:

```text
https://www.zonaprop.com.ar/propiedades/clasificado/propiedad-<posting_id>.html
```

## Modo de uso

1. Instalar dependencias de runtime:

```bash
python3 -m pip install -r requirements.txt
```

2. Ejecutar el script pasando el id del clasificado:

```bash
python3 zonaprop-property-scraping.py 12345678
```

Tambien acepta una URL de un clasificado y extrae el id:

```bash
python3 zonaprop-property-scraping.py "https://www.zonaprop.com.ar/propiedades/clasificado/..."
```

3. El script genera archivos en `data/`:

- Un `.csv` con una fila normalizada, compatible con los campos usados por el scraper de listados.
- Un `.json` con la propiedad normalizada y, si se usa `--raw`, el payload original del endpoint.
- Cuando la ficha publica lo expone, incluye datos de contacto del anunciante:
  `seller_whatsapp`, `seller_whatsapp_url`, `seller_partial_phone`,
  `seller_contact_phone`, `seller_email`, `publisher_url`,
  `publisher_license` y campos relacionados. El telefono directo y el email
  solo se completan si aparecen en el HTML publico; cuando no hay telefono
  directo, `seller_contact_phone` usa el numero de WhatsApp publico.

Opciones:

```bash
python3 zonaprop-property-scraping.py 12345678 --format csv
python3 zonaprop-property-scraping.py 12345678 --format json --raw
python3 zonaprop-property-scraping.py 12345678 --output-dir data/propiedades
```

Si tu Python local falla con `CERTIFICATE_VERIFY_FAILED`, podes desactivar la
verificacion SSL para esta llamada:

```bash
python3 zonaprop-property-scraping.py 12345678 --insecure
```

Para correr tests:

```bash
python3 -m pip install -r requirements-dev.txt
python3 -m pytest test
```
