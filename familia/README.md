# Árbol familiar

La página está en `/familia/` y no se enlaza desde la portada. Es una página pública accesible mediante su URL; una dirección sin enlaces y las indicaciones para buscadores no constituyen autenticación.

## Vista previa local

Desde la raíz del repositorio, ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000/familia/`. La página utiliza módulos y solicita datos JSON, por lo que necesita un servidor HTTP para la vista previa.

## Actualizar los datos

Edita `familia/records.json` y ejecuta desde la raíz del repositorio:

```sh
node familia/build-data.mjs
```

El script no necesita dependencias. Valida los identificadores, las referencias a familiares, las fechas, los ciclos de ascendencia y las rutas de imágenes. Genera `familia/data/catalog.json`, un índice de búsqueda en `familia/data/index.json` y una ficha por persona en `familia/data/people/`. Publica esos archivos junto con el resto de la página. No edites a mano los archivos generados.

Cada persona tiene un `id` estable, `name`, `givenNames` y `surnames` como lista explícita. Conserva los apellidos compuestos en una sola entrada, por ejemplo `"de las Heras"`. Los identificadores usan letras minúsculas sin tildes, números y guiones. `father` y `mother` hacen referencia a otras personas por su `id`.

Los eventos opcionales son `birth`, `baptism`, `marriages` y `death`. `marriages` es una lista y cada matrimonio puede incluir `spouse`, el identificador del cónyuge, si se conoce. Un evento puede tener `date` en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`, `place`, `note`, `transcription` y `documents`. Usa la precisión que aporta la fuente. Omite cualquier campo desconocido; no añadas valores vacíos ni fechas estimadas como si fueran exactas. Registra incertidumbres en `note` o en la lista `observations` de la persona.

`origins` recoge lugares asociados a una persona cuando no se conoce el tipo de evento. Se presenta como lugar de referencia, sin atribuirle un nacimiento. Usa el nombre del municipio o localidad en `place` para que el índice de lugares no duplique una población por sus distintas iglesias; guarda el nombre de la iglesia en `note`.

Para añadir una imagen, coloca el archivo en `familia/documents/` y usa una ruta relativa a `/familia/`. Se admiten nombres de archivo y subcarpetas con letras latinas sin tildes, números, guiones y guiones bajos, con extensión JPG, JPEG, PNG, WebP, AVIF o GIF:

```json
{
  "birth": {
    "date": "1872-02-11",
    "place": "Casaseca de las Chanas",
    "documents": [
      {
        "image": "documents/miguel-nacimiento.jpg",
        "alt": "Partida de nacimiento de Miguel Calvo Méndez",
        "transcription": "Texto de la partida…"
      }
    ]
  }
}
```

Una transcripción también puede figurar directamente en el evento, sin imagen. Las imágenes y transcripciones del ejemplo son ilustrativas; no forman parte de los datos iniciales.

## Ampliar el árbol

Añade personas y enlaza sus padres mediante identificadores existentes. No hay un límite de generaciones en los datos. La página solicita fichas individuales al navegar y mantiene visible un grupo acotado de familiares, en lugar de cargar y dibujar toda la ascendencia. El catálogo inicial contiene únicamente las ramas y sus personas de partida; el índice de nombres, apellidos y lugares se solicita al abrir el explorador. Los documentos se cargan cuando se muestran sus fichas.

El selector muestra entre dos y cuatro generaciones a la vez, con un máximo de quince nodos. Pulsa una persona para ver su ficha y usa «Continuar esta rama» o «Centrar en el árbol» para avanzar a cualquier generación. Puedes volver a la rama anterior, ampliar o reducir la vista y compartir el enlace a una persona. La memoria caché conserva hasta ochenta fichas. El índice muestra cuarenta resultados por tanda y permite seguir cargando; la búsqueda consulta todo el índice.

`branches` permite definir puntos de entrada con `id`, `label` y una lista `roots` de identificadores. No es necesario crear una rama por generación. Mantén los identificadores existentes para conservar los enlaces a personas.

## Criterios de la transcripción inicial

La fuente es `ABUELOS.docx`, que aporta cuatro bisabuelos del propietario de la web y sus ocho progenitores. Las parejas Miguel Calvo Méndez–Lucía Piorno Santiago y Bernardo Brioso Pérez–Ángela de las Heras Prada se deducen de su agrupación en el documento y de las fechas y lugares coincidentes de sus matrimonios. No se han creado personas intermedias no identificadas en la fuente.

Se conserva el bautismo de Bernardo el **02-06-1918**, tal como aparece en la fuente, con una observación para comprobarlo. Los lugares entre paréntesis tras los nombres de los ocho progenitores se conservan como `origins`, sin interpretarlos como lugares de nacimiento. No se atribuye lugar al bautismo de Miguel o Lucía, porque no figura expresamente. Se mantiene la grafía **Mª. Antonia**. Las iglesias citadas junto a los fallecimientos en Zamora se conservan en `death.note`, sin inferir entierros. La fuente inicial no contiene imágenes ni transcripciones de partidas.
