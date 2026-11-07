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

Cada persona tiene un `id` estable, `name`, `givenNames` y `surnames` como lista explícita. El campo opcional `source` identifica el documento que respalda su ficha; solo se muestra la atribución cuando existe ese campo. Conserva los apellidos compuestos en una sola entrada, por ejemplo `"de las Heras"`. Los identificadores usan letras minúsculas sin tildes, números y guiones. `father` y `mother` hacen referencia a otras personas por su `id`.

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

`defaultPerson` fija la persona seleccionada al abrir la página sin un enlace específico. Actualmente es `arturo-calvo-devesa`. `branches` permite definir puntos de entrada con `id`, `label` y una lista `roots` de identificadores. El único punto de partida actual es Arturo. No es necesario crear una rama por generación. Mantén los identificadores existentes para conservar los enlaces a personas.

## Alcance y procedencia de los datos

El archivo contiene treinta y tres personas y seis generaciones conectadas, con Arturo Calvo Devesa como punto de partida. Su ficha incluye únicamente el nombre, el lugar de nacimiento, Zamora, y los enlaces a sus padres. Sus padres son Bernardo Calvo Brioso y María Ángeles Devesa Herrero. Los datos de estas tres personas proceden de la información aportada por la familia; no se añaden fechas ni otros detalles no facilitados.

Los documentos recibidos pertenecen a la ascendencia de Bernardo Calvo Brioso. No se han atribuido esos antepasados a la rama Devesa Herrero ni se han creado ascendientes maternos de Arturo sin documentación. Los títulos de los documentos se interpretan respecto de Bernardo:

- `PADRES.docx`: sus padres, Nicanor Calvo Piorno y Rosario Brioso de las Heras; abuelos paternos de Arturo.
- `ABUELOS.docx`: sus cuatro abuelos y los nombres de sus progenitores; bisabuelos de Arturo.
- `BISABUELOS.docx`: amplía las ocho fichas de esos progenitores y aporta los nombres de sus dieciséis padres.

Las personas repetidas entre documentos comparten una sola ficha. Se conservan los identificadores anteriores de Enrique y Benito, aunque `BISABUELOS.docx` amplía sus nombres a Enrique Brioso de Mena y Benito José de las Heras Rabanal. El apellido de Mena se conserva como una entrada compuesta. Las personas documentadas incluyen `source`; las tres fichas aportadas directamente por la familia no muestran una atribución documental.

## Criterios de la transcripción

Las parejas Miguel Calvo Méndez–Lucía Piorno Santiago, Bernardo Brioso Pérez–Ángela de las Heras Prada, Nicanor Calvo Martín–Marcelina Méndez Maíllo, Enrique Brioso de Mena–Balbina Pérez Sánchez y Benito José de las Heras Rabanal–Mª. Antonia Prada Carretero se deducen de su agrupación y de las fechas y lugares coincidentes de sus matrimonios. No se inventan eventos matrimoniales cuando la fuente solo documenta que dos personas son progenitores.

Se conserva el bautismo de Bernardo Brioso Pérez el **02-06-1918**, tal como aparece en `ABUELOS.docx`, con una observación para comprobarlo. También se conserva el bautismo de Enrique Brioso de Mena el **29-01-1885**, frente al nacimiento el **28-01-1855**, tal como aparece en `BISABUELOS.docx`, y se señala la discrepancia. No se corrigen automáticamente los años ni las expresiones de las causas de fallecimiento: entre ellas, «taber dorsal» e «insuficiencia valvular central» se mantienen según la fuente.

Los lugares entre paréntesis tras los nombres de los antepasados se conservan como `origins` cuando no se conoce el tipo de evento. No se interpretan como lugares de nacimiento. Se elimina el lugar de referencia redundante cuando otra fuente aporta expresamente el nacimiento en ese mismo lugar. Para Josefa Rabanal Ibáñez, el índice usa Zamora y una observación conserva «Zamora. S. Esteban».

No se atribuye lugar a los bautismos de Miguel, Lucía, Nicanor Calvo Martín, Marcelina, Salvador o Vicenta, porque no figura expresamente. El bautismo de Rosario conserva la parroquia citada como una nota, sin inventar una fecha o un lugar independiente. Las iglesias citadas junto a matrimonios o fallecimientos se guardan en `note`, sin inferir entierros. La frase duplicada del matrimonio de Benito se registra una sola vez. Se mantiene la grafía **Mª. Antonia**. Las líneas incompletas de las fuentes se omiten, sin crear campos vacíos.

No se han añadido imágenes ni transcripciones de partidas que no se hayan facilitado.
