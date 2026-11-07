# Árbol familiar

La página está en `/familia/` y se enlaza desde el menú de la portada como «Family Tree», después de «Blog». Es una página pública accesible mediante su URL; las indicaciones para buscadores no constituyen autenticación.

## Vista previa local

Desde la raíz del repositorio, ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000/familia/`. La página utiliza módulos y solicita datos JSON, por lo que necesita un servidor HTTP para la vista previa.

## Actualizar los datos

Edita `familia/records.json` y ejecuta desde la raíz del repositorio:

```sh
node familia/build-data.mjs
```

El script no necesita dependencias. Valida los identificadores, las referencias a familiares, las fechas y los ciclos de ascendencia. Genera `familia/data/catalog.json`, un índice de búsqueda en `familia/data/index.json` y una ficha por persona en `familia/data/people/`. Publica esos archivos junto con el resto de la página. No edites a mano los archivos generados.

Cada persona tiene un `id` estable, `name`, `givenNames` y `surnames` como lista explícita. El campo opcional `source` identifica el documento que respalda su ficha; solo se muestra la atribución cuando existe ese campo. Conserva los apellidos compuestos en una sola entrada, por ejemplo `"de las Heras"`. Los identificadores usan letras minúsculas sin tildes, números y guiones. `father` y `mother` hacen referencia a otras personas por su `id`.

La sección «Descendencia» muestra los hijos documentados y enlaza a sus fichas después de «Sus padres». El script genera esas relaciones a partir de `father` y `mother`; no añadas `children`, `parentSummaries` ni `partners` a `records.json`. Las fichas generadas contienen resúmenes con el identificador, nombre, nombres de pila y apellidos de los familiares para mostrar los círculos de navegación sin descargar sus registros completos ni el índice global.

`parentSummaries` identifica los padres conocidos mediante `relation: "father"` o `"mother"`. Cada resumen de `children` incluye también sus referencias `father` y `mother` cuando se conocen. `partners` reúne los cónyuges documentados en `marriages` (`relationship: "spouse"`) y los otros progenitores identificados en un hijo compartido (`relationship: "coparent"`). La lista `sharedChildren` de cada relación contiene únicamente los identificadores de los hijos que tienen a ambas personas como padres. Compartir un hijo no crea un matrimonio ni completa un progenitor desconocido a partir de un cónyuge. Un matrimonio documentado tiene prioridad sobre la clasificación de progenitor compartido.

Cuando se conocen las fechas de nacimiento y fallecimiento, los años de vida incluyen la edad cumplida al fallecer entre paréntesis, por ejemplo `1948 – 2023 (75 años)`. Si solo se conocen los años o fechas parciales, la diferencia de años aparece como aproximada. No se calcula la edad actual cuando no hay fecha de fallecimiento.

Los eventos opcionales son `birth`, `baptism`, `marriages` y `death`. `marriages` es una lista y cada matrimonio puede incluir `spouse`, el identificador del cónyuge, si se conoce. Un evento puede tener `date` en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`, `place`, `note` y `transcription`. Usa la precisión que aporta la fuente. Omite cualquier campo desconocido; no añadas valores vacíos ni fechas estimadas como si fueran exactas. Registra incertidumbres en `note` o en la lista `observations` de la persona.

`origins` recoge lugares asociados a una persona cuando no se conoce el tipo de evento. Se presenta como lugar de referencia, sin atribuirle un nacimiento. Usa el nombre del municipio o localidad en `place` para que el índice de lugares no duplique una población por sus distintas iglesias; guarda el nombre de la iglesia en `note`.

Este repositorio no almacena imágenes de las personas: la cuenta de github.io solo dispone de 1 GB de almacenamiento gratuito y las imágenes de la familia ocupan muchos gigabytes. Por eso las fichas no muestran imágenes y `build-data.mjs` rechaza el campo `documents` en cualquier evento. Una transcripción puede figurar directamente en el evento, en el campo `transcription`.

## Ampliar el árbol

Añade personas y enlaza sus padres mediante identificadores existentes. No hay un límite de generaciones en los datos. La página solicita fichas individuales al navegar y mantiene visible un grupo acotado de familiares, en lugar de cargar y dibujar toda la ascendencia. El catálogo inicial contiene únicamente las ramas y sus personas de partida; el índice de nombres, apellidos y lugares se solicita al abrir el explorador.

El selector muestra entre dos y cuatro generaciones de fichas completas alrededor de la persona activa. Al pulsar una ficha o un círculo familiar, el árbol se centra en esa persona. Los padres conocidos del límite visible y los hijos de la persona activa aparecen como círculos con iniciales. Los cónyuges documentados y los otros progenitores conocidos pueden mostrarse junto a la persona activa; las conexiones a los hijos se comparten únicamente cuando ambas referencias parentales están documentadas. Puedes volver a la rama anterior, ampliar o reducir la vista y compartir el enlace a una persona. La memoria caché conserva hasta ochenta fichas. El índice muestra cuarenta resultados por tanda y permite seguir cargando; la búsqueda consulta todo el índice.

`defaultPerson` fija la persona seleccionada al abrir la página sin un enlace específico. Actualmente es `arturo-calvo-devesa`. `branches` permite definir puntos de entrada con `id`, `label` y una lista `roots` de identificadores. El único punto de partida actual es Arturo. No es necesario crear una rama por generación. Mantén los identificadores existentes para conservar los enlaces a personas.

## Mapa de lugares

La pestaña «Lugares» carga el mapa interactivo cuando se abre. Utiliza Leaflet 1.9.4 y las teselas de OpenStreetMap, con su atribución visible. La biblioteca y su licencia se conservan localmente entre los recursos de la página. Los marcadores y sus agrupaciones permiten explorar las localidades; la búsqueda y la lista de lugares también permiten seleccionar una localidad y encontrar sus personas relacionadas. Si las teselas no están disponibles, la lista sigue siendo utilizable.

`familia/places.json` conserva las coordenadas verificadas y una URL de fuente para cada localidad. El proceso de construcción las incorpora al índice generado; no se geocodifican de nuevo en cada visita. Los doce lugares actuales están en España y las posiciones representan el centro de cada localidad, sin identificar domicilios. Villardeciervos se sitúa en la provincia de Zamora, según la confirmación de la familia.

Al añadir un lugar nuevo, la lista sigue funcionando aunque todavía no tenga coordenadas. Comprueba su municipio y provincia antes de incorporarlo al mapa y pregunta a la familia si la localidad no se puede identificar con seguridad. No asignes una posición por aproximación ni conviertas una iglesia citada en las notas en una localidad independiente.

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

La familia confirmó que San Ildefonso, en las fichas de Nicanor Calvo Piorno y Rosario Brioso de las Heras, es la iglesia de Zamora donde se celebró el funeral. Esa aclaración figura en `death.note`; el lugar de fallecimiento se mantiene como Zamora y no se crea un evento de entierro ni un lugar adicional para el mapa.

No se han añadido transcripciones de partidas que no se hayan facilitado.
