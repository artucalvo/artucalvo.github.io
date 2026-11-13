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

Las solicitudes de datos revalidan la caché del navegador al cargar la página. Una pestaña que ya estaba abierta conserva sus fichas en memoria hasta que se recarga. Si cambia `familia.js` o un módulo que importa, actualiza sus versiones en las URL de los módulos para evitar que se mezclen archivos antiguos y nuevos en la caché.

Cada persona tiene un `id` estable, `name`, `givenNames` y `surnames` como lista explícita (vacía cuando solo se conoce el nombre de pila). No se admite `source` en las personas ni en la raíz de `records.json`: las fichas y el catálogo no incluyen atribuciones a archivos. La procedencia se conserva únicamente en este README y en los registros internos de `sources/`. Conserva los apellidos compuestos en una sola entrada, por ejemplo `"de las Heras"`. Un apellido se escribe igual en todas las fichas: si el árbol ya lo recoge sin partícula, como Luelmo o Carrascal, no se le añade «de» aunque la partida lo escriba así (véase «Apellidos con y sin partícula»). Los identificadores usan letras minúsculas sin tildes, números y guiones. `father` y `mother` hacen referencia a otras personas por su `id`.

Por indicación de la familia, los apellidos que solo se deducen del parentesco se muestran en las fichas y se identifican como inferidos en observaciones. Cuando la filiación deja dudas sobre el apellido, se conserva solo el nombre documentado y se explica la incertidumbre.

Los hermanos se deducen de los progenitores conocidos. Cuando se conoce el parentesco pero no la filiación, `siblings` contiene identificadores recíprocos en ambas fichas; el proceso de construcción valida los enlaces y genera `siblingSummaries`. No se inventa un progenitor compartido.

La sección «Descendencia» muestra los hijos documentados y enlaza a sus fichas después de «Sus padres». El script genera esas relaciones a partir de `father` y `mother`; no añadas `children`, `parentSummaries` ni `partners` a `records.json`. Las fichas generadas contienen resúmenes con el identificador, nombre, nombres de pila y apellidos de los familiares para mostrar los círculos de navegación sin descargar sus registros completos ni el índice global.

`parentSummaries` identifica los padres conocidos mediante `relation: "father"` o `"mother"`. Cada resumen de `children` incluye también sus referencias `father` y `mother` cuando se conocen. Dos personas con un hijo en común se consideran casadas: si `records.json` no recoge ese matrimonio, el script añade a las fichas generadas de ambas una entrada en `marriages` con el `spouse`, sin fecha ni lugar. No hace falta escribirla a mano; añádela en las dos fichas de `records.json` solo cuando haya una fecha, un lugar u otros datos que registrar. `partners` reúne a los cónyuges de cada persona. La lista `sharedChildren` de cada relación contiene únicamente los identificadores de los hijos que tienen a ambas personas como padres. Un matrimonio no completa un progenitor desconocido a partir de un cónyuge.

Las fichas del árbol, la cabecera de cada ficha y el índice muestran las fechas con la precisión que tengan: `n. 9 dic 1832`, `n. dic 1832` o `n. 1832`. Si no consta la fecha de nacimiento pero sí la del bautismo, se muestra esta con la indicación `baut.`, por ejemplo `baut. 27 nov 1822`. Cuando se conocen las fechas de nacimiento y fallecimiento, se incluye la edad cumplida al fallecer entre paréntesis, por ejemplo `3 may 1948 – 12 ene 2023 (74 años)`. Si solo se conocen los años o fechas parciales, o si la edad se cuenta desde el bautismo, aparece como aproximada. No se calcula la edad actual cuando no hay fecha de fallecimiento.

Los eventos opcionales son `birth`, `baptism`, `marriages`, `death` y `burial` (entierro). Una fecha de entierro no se convierte en fecha de fallecimiento. `marriages` es una lista y cada matrimonio puede incluir `spouse`, el identificador del cónyuge, si se conoce. Un evento puede tener `date` en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`, `place`, `note` y `transcription`. Usa la precisión que aporta la fuente. Omite cualquier campo desconocido; no añadas valores vacíos ni fechas estimadas como si fueran exactas. Consulta a la familia antes de cambiar datos contradictorios o identidades dudosas; conserva el valor existente y registra el contraste en el lote correspondiente, sin trasladarlo automáticamente a `note` u `observations`. Los textos de las personas no citan archivos, documentos, fotografías ni versiones. Las notas expresan los hechos y sus límites directamente; solo `observations` puede referirse a «la partida de nacimiento», «la partida de bautismo», «la partida de matrimonio» o «la partida de fallecimiento». Las transcripciones contienen solo texto legible de la partida, con `[ilegible]` para los huecos; las dudas de lectura y los detalles de procedencia se explican en los registros internos. Se escriben como párrafos continuos separados por una línea en blanco, sin conservar cortes de línea ni guiones de final de línea del original. El proceso de construcción rechaza los saltos de línea aislados.

`origins` recoge lugares asociados a una persona cuando no se conoce el tipo de evento. Se presenta como lugar de referencia, sin atribuirle un nacimiento. Usa el nombre del municipio o localidad en `place` para que el índice de lugares no duplique una población por sus distintas iglesias; guarda el nombre de la iglesia en `note`.

`occupations` recoge los oficios que una partida u otro testimonio atribuye expresamente a la persona. Su formato y su alcance se describen en «Profesiones».

Este repositorio no almacena imágenes de las personas: la cuenta de github.io solo dispone de 1 GB de almacenamiento gratuito y las imágenes de la familia ocupan muchos gigabytes. Por eso las fichas no muestran imágenes y `build-data.mjs` rechaza el campo `documents` en cualquier evento. Una transcripción puede figurar directamente en el evento, en el campo `transcription`.

## Ampliar el árbol

Añade personas y enlaza sus padres mediante identificadores existentes. No hay un límite de generaciones en los datos. La página solicita fichas individuales al navegar y mantiene visible un grupo acotado de familiares, en lugar de cargar y dibujar toda la ascendencia. El catálogo inicial contiene únicamente las ramas y sus personas de partida; el índice de nombres, apellidos y lugares se solicita al abrir el explorador.

El selector muestra entre dos y cuatro generaciones de fichas completas alrededor de la persona activa. Al pulsar una ficha o un círculo familiar, el árbol se centra en esa persona. Los padres conocidos del límite visible y los hijos de la persona activa aparecen como círculos con iniciales. Los cónyuges se muestran junto a la persona activa, con un máximo de dos, y sus padres conocidos también aparecen como círculos. Las conexiones a los hijos se comparten únicamente cuando ambas referencias parentales están documentadas y las dos personas se muestran. Puedes volver a la rama anterior, ampliar o reducir la vista y compartir el enlace a una persona. La memoria caché conserva hasta ochenta fichas. El índice muestra cuarenta resultados por tanda y permite seguir cargando; la búsqueda consulta todo el índice.

Los hermanos y hermanas de la persona activa aparecen como círculos con iniciales y borde discontinuo, junto al lado exterior de su ficha y con una etiqueta «Hermano/a». Al pulsarlos se abre su ficha. Un hermano que también es ascendiente directo de la persona de partida, como María y Antonio Unzueta Fernández entre sí, es un círculo más, pero blanco, igual que el hijo que continúa la línea directa. Los hermanos de las demás personas visibles no tienen círculo; si ya aparecen como ascendientes, su ficha añade «Hermano/a» a la relación y no se duplican.

La disposición del árbol está en `familia/tree-layout.mjs`, sin dependencias del navegador. Sus comprobaciones recorren todas las personas del archivo y confirman, entre otras cosas, que nada se solapa y que la persona activa queda centrada. Conviene ejecutarlas desde la raíz del repositorio después de añadir datos:

```sh
node --test familia/tree-layout.test.mjs
```

`defaultPerson` fija la persona seleccionada al abrir la página sin un enlace específico. Actualmente es `arturo-calvo-devesa`. `branches` permite definir puntos de entrada con `id`, `label` y una lista `roots` de identificadores. El único punto de partida actual es Arturo. No es necesario crear una rama por generación. Mantén los identificadores existentes para conservar los enlaces a personas.

## Mapa de lugares

La pestaña «Lugares» carga el mapa interactivo cuando se abre. Utiliza Leaflet 1.9.4 y las teselas de OpenStreetMap, con su atribución visible. La biblioteca y su licencia se conservan localmente entre los recursos de la página. Los marcadores y sus agrupaciones permiten explorar las localidades; la búsqueda y la lista de lugares también permiten seleccionar una localidad y encontrar sus personas relacionadas. Si las teselas no están disponibles, la lista sigue siendo utilizable.

`familia/places.json` conserva las coordenadas verificadas y una URL de fuente para cada localidad. El proceso de construcción las incorpora al índice generado; no se geocodifican de nuevo en cada visita. El índice contiene ochenta y cinco referencias de lugar, con coordenadas verificadas para ochenta y cuatro localidades o municipios de España; Galicia se conserva como referencia regional sin marcador, y La Torre del Salinar y Valcamín de Abajo, pueblos que ya no existen, usan por indicación de la familia los puntos de Entrala y de Tardobispo. Las posiciones representan el centro o un punto representativo oficial de cada localidad, sin identificar domicilios. Villardeciervos se sitúa en la provincia de Zamora y Roales corresponde a Roales del Pan (Zamora), según la confirmación de la familia; también existen un Roales en Valderas (León) y Roales de Campos (Valladolid). Los once lugares que añade `TATARABUELOS SEGUNDOS.docx` también están en la provincia de Zamora. Fresnadillo es la localidad de Bermillo de Sayago que `TATARABUELOS TERCEROS.docx` llama Fresnadillo de Sayago; Muga de Alba pertenece a Losacino, y Sogo, a Pereruela. Fuentesaúco es el municipio zamorano, a menos de veinte kilómetros de El Cubo del Vino, y no Fuentesaúco de Fuentidueña (Segovia).

Al añadir un lugar nuevo, la lista sigue funcionando aunque todavía no tenga coordenadas. Comprueba su municipio y provincia antes de incorporarlo al mapa y pregunta a la familia si la localidad no se puede identificar con seguridad. No asignes una posición por aproximación ni conviertas una iglesia citada en las notas en una localidad independiente.

## Profesiones

`occupations` es una lista, también cuando solo hay un oficio. Cada entrada tiene `name`, el oficio con la palabra del original, y puede llevar `date`, el año o la fecha en que consta, con el mismo formato que en los eventos, y `note`. La ficha los muestra en la sección «Profesión», justo debajo del nombre y antes de «Sus padres», para que se vean sin recorrer una ficha larga. `build-data.mjs` valida la lista y rechaza `occupation` en singular, porque la ficha no lo mostraría.

El 11 de noviembre de 2026 se revisaron todas las observaciones, notas y transcripciones del archivo. Solo tres personas tienen un oficio expreso: Miguel Calvo Méndez, labrador en su matrimonio de 1898; Bernardo Brioso Pérez, jornalero en el suyo de 1903, y Cristóbal Unzueta, flebotomiano, es decir, sangrador, en la demanda de 1794. Las partidas transcritas anteriores a 1800 no indican el oficio de su titular; como mucho, un cargo o una condición. Los documentos DOCX no recogen ningún oficio.

Ese mismo día la familia decidió registrar también como soldado a Salvador Piorno Tuda. Su matrimonio de 1879 lo llama «licenciado del Ejército con licencia absoluta», que indica su situación militar: ya había dejado el servicio. Por eso su entrada no lleva `date` y el año queda en `note`. Se conserva la observación que ya recogía el dato.

Al transcribir las partidas de los bisabuelos se añadieron cuatro oficios expresos: Julián Piorno Vega, «senarero» en el bautismo de su hijo Salvador (1843), es decir, criado de labranza que cultivaba por su cuenta una senara cedida por el amo; Carlos Santiago Garrote, «de oficio de labrador» en el bautismo de su hija Vicenta (1841), y José Sastre Sastre y Faustino Santiago Garrote, abuelos de la bautizada, de quienes la misma partida dice «todos de oficio de labrador». Faustino había muerto en 1826, por lo que su entrada no lleva `date`. La partida aplica la fórmula también a las dos abuelas, Josefa Garrote y Bernarda Esteban; no se les ha registrado oficio. Las demás partidas de bautismo, matrimonio y entierro de esas dos generaciones (Casaseca de las Chanas, Tardobispo, Malillos, Morales del Vino, El Cubo del Vino, Abelón, Peleas de Arriba y Zamora) no expresan el oficio de los titulares.

En la carpeta de tatarabuelos segundos constan cuatro oficios más: Manuel Prada Sebastián, «Subteniente retirado» en su entierro de 1851 (sin `date`, como en el caso de Salvador Piorno); Francisco Tuda Porras, «oficio labrador» en su entierro de 1841; Manuel Martín Prada, «oficio labrador» en el suyo de 1838, y su padre, Miguel Martín Avedillo, «de oficio labrador» según esa misma partida, posterior a su muerte. El entierro de María Juana Morales (1865) llama labrador a su segundo marido, Aniceto Sevillano, que no tiene ficha. Las demás partidas de esa generación, de 1751 a 1875, no expresan el oficio de los titulares.

En la carpeta de tatarabuelos terceros, con partidas de 1713 a 1853, ninguna expresa un oficio. Solo constan cargos y condiciones, recogidos como observaciones: Bernardo Alonso Salvador y Bernardo Alonso Cabrero, familiares del Santo Oficio (1714 y 1818); José Piorno Zurdo, que casó en 1769 con licencia del coronel de Milicias de Salamanca y no testó en 1813 «por ser pobre».

En la carpeta de tatarabuelos cuartos, con partidas de 1679 a 1825, tampoco consta ningún oficio expreso. Fernando Delgado Ramos era «estudiante de Filosofía» en Santo Domingo de Zamora cuando fue padrino de su hermana en 1768, y el matrimonio de Manuel Vega Antón (1739) llama a su padre «Juan Vega Molinero», que puede ser un apodo; los dos datos se recogen como observaciones.

No se han registrado como profesión, a falta de una decisión de la familia:

- Los cargos y condiciones: José Zurdo, alcalde al morir en 1748; Andrés Delgado, «capitán»; Francisco Zamora, «el hidalgo», y seis personas cuyas partidas de fallecimiento o entierro las llaman pobres.
- La fórmula «dedicada a las ocupaciones propias de su sexo» de Lucía Piorno Santiago y Ángela de las Heras Prada en sus matrimonios.
- Los escribanos, fieles de fechos, familiares del Santo Oficio y presbíteros que aparecen en partidas ajenas con el nombre de alguien del árbol, mientras no se confirme que son la misma persona.

Por ahora no hay un índice de profesiones junto a los de personas, apellidos y lugares. Se añadirá cuando haya suficientes fichas con oficio.

## Apellidos con y sin partícula

Un mismo apellido se escribe igual en todas las fichas. En las partidas de los siglos XVI a XVIII, la partícula «de» ante un apellido es un uso del escribano y no un apellido distinto: la partida de fallecimiento de Francisco Zamora García, de 1723, lo llama «Dn Franco de Zamora» en el texto y «Franco Zamora» en el margen, y Manuel Carrascal Bragado es «hijo lexítimo de Pedro Carrascal» en su bautismo y «Manuel Carrascal» en su entierro. Los resúmenes familiares tampoco son constantes. Como cada ficha tomó la forma del encabezado del lote que la creó, padres e hijos aparecían con formas distintas y el índice separaba, por ejemplo, Carrascal y de Carrascal.

El 11 de noviembre de 2026 la familia decidió escribir sin partícula los apellidos que el árbol recogía de las dos formas. Cambian cincuenta y cuatro personas de diecinueve apellidos, y el índice pasa de 256 a 237 apellidos:

- Aguilar: Luisa Aguilar.
- Alcántara: Francisco Alcántara y Juan Alcántara Lucas.
- Ampudia: Felipe Ampudia y Juan Ampudia Ratón.
- Arroyo: Diego Arroyo.
- Carrascal: Luisa Carrascal y Manuel Carrascal Bragado.
- Cifuentes: Ana Cifuentes.
- Cuesta: Domingo Cuesta.
- Llamas: Isabel Llamas.
- Luelmo: Alonso Luelmo, Ana Luelmo, Atilana Luelmo Arroyo, Bartolomé Luelmo, Francisca Luelmo Martín, Isabel Luelmo, Jerónimo Luelmo Pinto, Josefa Bambón Luelmo, Josefa Luelmo, Juan Pérez Luelmo, Margarita Luelmo Nieto, María Luelmo Bueno, María Luelmo Martín (la nacida en 1653) y los tres Juan Luelmo, padres de Francisca, Margarita y Jerónimo.
- Pereruela: Miguel Pereruela.
- Peña: Josefa Fernández Peña y María Peña Domínguez.
- Prada: Diego Prada Delgado, Felipa Prada Martín, Francisco Prada Cifuentes, Manuel Martín Prada, Manuel Prada Sebastián, Pedro Prada, Pedro Prada Martín y Tirso Prada.
- Sampedro: Isabel Sampedro.
- Trigo: Alonso Trigo, Inés Trigo Luelmo, Juana Miguel Trigo, María Carrascal Trigo y Miguel Trigo.
- Urueña: Ana Urueña, Engracia Urueña, Francisco Ramos Urueña, Isabel Urueña Arenas y Luis Urueña.
- Valencia: Manuela Jambrina Valencia y Teresa Valencia Celenque.
- Valladolid: Luis Valladolid.
- Vega: Pascual Vega.
- Zamora: Luisa Zamora Luelmo.

Manuel Prada Sebastián deja así la forma «de Prada» que la familia había elegido el 7 de noviembre de 2026; las partidas de su línea escriben tanto «Dn Manuel de Prada» como «Ángel Pradas». La regla se aplica también a dos apellidos con artículo que su línea escribía de las dos formas: Domingo Cuesta, cuyos descendientes se apellidan Cuesta, y María Peña Domínguez y Josefa Fernández Peña, hija y nieta de Pedro Peña Rodríguez.

Se conservan los identificadores, aunque muchos incluyan «de», para no romper los enlaces. Las transcripciones mantienen la grafía de cada partida y las citas literales tampoco cambian, como «Juan de Luelmo (del huelmo)»; solo se ha actualizado la observación de María Luelmo Martín, la nacida en 1653, que nombra a su hermano Juan. Los apellidos que el árbol escribe siempre con partícula se mantienen: de las Heras, de la Calle, de la Fuente, de la Iglesia, de las Infantas, de Almancaya, de Chaves, de Herrera, de Lera, de Mena, de Muga, de Olmedo, de Paz, de Segovia y de Vergara. Las secciones de los lotes y de las revisiones conservan los nombres tal como se escribían cuando se redactaron.

Hay ahora dos mujeres llamadas María Luelmo Martín, ambas de Morales del Vino: la nacida el 28-08-1653, hija de Bartolomé Luelmo e Inés Martín, y la nacida el 28-02-1656, hija de Juan Luelmo y Felipa Martín. Antes solo las distinguía la partícula; ahora las distinguen sus padres y sus fechas.

La prueba «a surname is written the same way for everyone, never both with and without «de»», en `tree-layout.test.mjs`, falla si un apellido vuelve a aparecer de las dos formas. Al añadir personas, usa la forma que ya tiene el árbol.

Quedan pendientes de una decisión de la familia, sin cambios, otras grafías de un mismo apellido entre padres e hijos:

- Josefa Rivera, así llamada en su entierro, y su hijo Francisco Bragado Rivero.
- Bárbola Blanca y su hija Ana Bernabé Blanco; es la forma femenina del apellido, como «Galana» por Galán.
- Ana Mateo y su hijo Andrés Pérez Mateos.
- Alonso de San Pedro, su hija Isabel Sampedro y su nieto Alonso de Mena Sampedro.
- Domingo Ortiz y su hija Inés Ortijo, y Mariana Ortizo Benito, a quien el bautismo de su nieto Atilano Pascual Villar llama «Mariana Ortijo».
- Felipa Bobillo y su hija Josefa Martínez Botillo; también María Ramos Botillo.
- Domingo Fernández y su hija Sebastiana Hernández Vega.
- Maria Perez Ybieta-Arteaga, de la rama vasca, que conserva la grafía del archivo; en el índice, Perez figura separado de Pérez.

## Alcance y procedencia de los datos

El archivo contiene mil sesenta y cinco personas y hasta catorce generaciones conectadas, con Arturo Calvo Devesa como punto de partida. Las generaciones más lejanas se alcanzan a través de antepasados que aparecen en dos posiciones del árbol, como Francisco Hernández Nieto y Teresa Gaitán Rodríguez, padres de Teodora Hernández Gaitán, o la pareja compartida por Margarita y Fernando Girón Fernández, que aparecen en generaciones distintas. La decimocuarta se alcanza a través de María Carrascal Trigo, abuela de Jerónima Pérez Luelmo: `TATARABUELOS SEXTOS.docx` la hace hija de Manuel Carrascal Bragado e Inés Trigo Luelmo, que ya eran antepasados de Arturo por otra línea. La ficha de Arturo incluye únicamente el nombre, el lugar de nacimiento, Zamora, y los enlaces a sus padres. Sus padres son Bernardo Calvo Brioso y María Ángeles Devesa Herrero. Los datos de estas tres personas proceden de la información aportada por la familia; no se añaden fechas ni otros detalles no facilitados.

Los documentos DOCX recibidos pertenecen a la ascendencia de Bernardo Calvo Brioso. No se han atribuido esos antepasados a la rama Devesa Herrero. La ascendencia materna de Arturo se inicia con el lote de fotografías descrito al final de este README. Los títulos de los documentos DOCX se interpretan respecto de Bernardo:

- `PADRES.docx`: sus padres, Nicanor Calvo Piorno y Rosario Brioso de las Heras; abuelos paternos de Arturo.
- `ABUELOS.docx`: sus cuatro abuelos y los nombres de sus progenitores; bisabuelos de Arturo.
- `BISABUELOS.docx`: amplía las ocho fichas de esos progenitores y aporta los nombres de sus dieciséis padres.
- `TATARABUELOS PRIMEROS.docx`: amplía las dieciséis fichas de esos padres y aporta los nombres de sus treinta y dos padres.
- `TATARABUELOS SEGUNDOS.docx`: amplía las treinta y dos fichas de esos padres y aporta los nombres de sus sesenta y cuatro padres.
- `TATARABUELOS TERCEROS.docx`: amplía esas sesenta y cuatro fichas y añade ciento veinte padres identificados sin ambigüedad. Reutiliza dos fichas existentes para los padres de Fernando Girón Fernández; otras seis menciones de padres quedan pendientes de resolver tres identidades repetidas. Estas tres identidades se resuelven con el lote siguiente.
- `TATARABUELOS CUARTOS.docx`: amplía ciento veintidós fichas existentes, resuelve las tres identidades anteriores mediante cinco personas y añade doscientos siete progenitores identificados sin ambigüedad. Las fechas, identidades y localidades que siguen pendientes se detallan en el registro de este lote.
- `TATARABUELOS QUINTOS.docx`: amplía ciento noventa y dos fichas existentes y añade trescientas nueve personas. Doscientas cincuenta y una son progenitores identificados sin ambigüedad; las demás proceden de las dieciséis identidades que el lote anterior dejó pendientes y que la familia confirmó con los datos de este documento. Lo pendiente se detalla en el registro de este lote.
- `TATARABUELOS SEXTOS.docx`: amplía trescientas cuatro fichas existentes y añade doscientas doce personas. Ciento ochenta y tres son progenitores identificados sin ambigüedad; las demás proceden de los pendientes del lote anterior que la familia resolvió con los datos de este documento. Lo pendiente se detalla en el registro de este lote.

Las personas repetidas entre documentos comparten una sola ficha. Se conservan los identificadores anteriores de Enrique y Benito, aunque `BISABUELOS.docx` amplía sus nombres a Enrique Brioso de Mena y Benito José de las Heras Rabanal, y el de Ángel, aunque `TATARABUELOS PRIMEROS.docx` amplía su nombre a Ángel Celedonio Prada Girón. Del mismo modo, `TATARABUELOS SEGUNDOS.docx` amplía los nombres de Diego Benito Calvo Salvador, María Juana Morales Valladolid y María Rosa de las Mercedes Hernández Martín sin cambiar sus identificadores; el documento abrevia «Mª Rosa», y se mantiene «María Rosa», como la escribe `TATARABUELOS PRIMEROS.docx`. Por decisión de la familia, Manuel Prada Sebastián pasó a llamarse Manuel de Prada Sebastián, como lo escriben las dos versiones de `TATARABUELOS SEGUNDOS.docx`, mientras su hijo mantenía el nombre de Ángel Celedonio Prada Girón. Desde el 11 de noviembre de 2026 vuelve a llamarse Manuel Prada Sebastián, como el resto de su línea, por la unificación descrita en «Apellidos con y sin partícula»; conserva su identificador. El apellido de Mena se conserva como entrada compuesta. Las atribuciones anteriores se conservan en `sources/display-cleanup.json`, separadas de los datos de las personas y de la web.

Las fotografías de las partidas de `TATARABUELOS PRIMEROS.docx` se conservan fuera del repositorio. Sirven para comprobar el documento y, por decisión de la familia, también para completarlo; su atribución se conserva en los registros internos. Con ellas coinciden los dieciséis nacimientos, los cuatro bautismos, seis de los siete matrimonios y cinco de los once fallecimientos; las demás fechas y los datos añadidos se detallan en los criterios de la transcripción. El nombre de un archivo no basta para identificar a una persona: `Josefa Rabanal Arroyo2.JPG` es la partida de Josefa Rabanal Ibáñez (Arroyo es el cura que firma) y `Muerte de Manuel Martín.JPG` corresponde a un Manuel Martín de Villadepera, marido de Catalina Jorge, enterrado en 1731, y no al padre de Felipa Martín Hernández.

`TATARABUELOS SEGUNDOS.docx` existe en dos versiones. La de la carpeta «Árbol genealógico2», de 2018, contiene todo lo que recoge la versión de 2015 de la carpeta «Tatarabuelos segundos» y añade dos matrimonios, tres fallecimientos y nueve causas de fallecimiento. Ningún dato se contradice, por lo que se transcribe la versión de 2018 y se cita como una sola fuente. Sus fechas todavía no se han comparado con las fotografías de las partidas, que se revisarán más adelante. Hasta entonces, cada «Falleció» se registra como fallecimiento, tal como figura en el documento.

## Criterios de la transcripción

Las parejas Miguel Calvo Méndez–Lucía Piorno Santiago, Bernardo Brioso Pérez–Ángela de las Heras Prada, Nicanor Calvo Martín–Marcelina Méndez Maíllo, Enrique Brioso de Mena–Balbina Pérez Sánchez y Benito José de las Heras Rabanal–Mª. Antonia Prada Carretero se deducen de su agrupación y de las fechas y lugares coincidentes de sus matrimonios. Cuando la fuente solo documenta que dos personas son progenitores, se asume que estuvieron casadas, por decisión de la familia. Ese matrimonio se muestra sin fecha ni lugar, y no se inventan esos detalles.

Por decisión familiar del lote de fotografías de ABUELOS, el bautismo de Bernardo Brioso Pérez pasa del **02-06-1918** de `ABUELOS.docx` al **02-06-1878** de la partida; se retira la observación de comprobación pendiente. En el cotejo de las dos versiones de `BISABUELOS.docx`, la familia confirmó el 8 de noviembre de 2026 que Enrique Brioso de Mena fue bautizado el **29-01-1855**, al día siguiente de su nacimiento, el **28-01-1855**. Se corrige el **29-01-1885** de ambos documentos y se retira la observación de discrepancia resuelta; la lectura literal se conserva en el registro de la fuente. No se corrigen automáticamente los años ni las expresiones de las causas de fallecimiento: entre ellas, «taber dorsal» e «insuficiencia valvular central» se mantienen según la fuente.

Los lugares entre paréntesis tras los nombres de los antepasados se conservan como `origins` cuando no se conoce el tipo de evento. No se interpretan como lugares de nacimiento. Se elimina el lugar de referencia redundante cuando otra fuente aporta expresamente el nacimiento en ese mismo lugar. Para Josefa Rabanal Ibáñez, `BISABUELOS.docx` indica «Zamora. S. Esteban» y `TATARABUELOS PRIMEROS.docx` lo aclara: nació en Zamora y fue bautizada en la iglesia de S. Esteban. Su nacimiento y su bautismo sustituyen el lugar de referencia y la observación anterior. `TATARABUELOS SEGUNDOS.docx` aclara del mismo modo los lugares de sus padres: José Rabanal Martínez nació en la parroquia de San Torcuato y su fallecimiento figura en «Zamora (San Esteban)», y Manuela Ibáñez Martín nació en Zamora, en la iglesia de S. Lázaro. Esas notas sustituyen las observaciones que conservaban «Zamora, S. Esteban» y «Zamora, S. Lázaro».

Las fotografías de ABUELOS documentan los bautismos de Miguel y Lucía en Casaseca de las Chanas; el de Miguel cita expresamente la iglesia de San Juan Bautista. No se atribuye lugar a los bautismos de Nicanor Calvo Martín, Marcelina, Salvador o Vicenta, porque no figura expresamente. El bautismo de Rosario conserva la parroquia citada como una nota, sin inventar una fecha o un lugar independiente. Las iglesias citadas junto a matrimonios o fallecimientos se guardan en `note`, sin inferir entierros. La frase duplicada del matrimonio de Benito se registra una sola vez. Se mantiene la grafía **Mª. Antonia**. Las líneas incompletas de los resúmenes familiares se omiten al extraer los datos, sin crear campos vacíos; las transcripciones literales de fotografías conservan los huecos como `[ilegible]`.

La familia confirmó que San Ildefonso, en las fichas de Nicanor Calvo Piorno y Rosario Brioso de las Heras, es la iglesia de Zamora donde se celebró el funeral. Esa aclaración figura en `death.note`; el lugar de fallecimiento se mantiene como Zamora y no se crea un evento de entierro ni un lugar adicional para el mapa.

En `TATARABUELOS PRIMEROS.docx`, las parejas se deducen del mismo modo, por su agrupación y por la fecha y el lugar de su matrimonio. El documento deja en blanco el matrimonio de Francisco de las Heras Pascual y Josefa Rabanal Ibáñez, que se muestra sin fecha ni lugar. El nacimiento de Eduviges Sánchez Izquierdo figura en «El Cubo»: se indexa como El Cubo del Vino, donde se casó y de donde eran sus padres, y `note` conserva la lectura.

El documento nombra dos veces a «Luisa Alonso (Moraleja del Vino)», como madre de Lucas Calvo Alonso, nacido en 1788, y de Florencio Brioso Alonso, nacido en 1833. Son dos personas: los bautismos de ambos las distinguen por sus padres y `TATARABUELOS SEGUNDOS.docx` las recoge como Luisa Alonso Alonso y Luisa Alonso Delgado. Los identificadores de estas treinta y dos personas ya incluían los dos apellidos que les da ese documento, de modo que se han conservado al ampliar sus fichas.

Siete fechas del documento no coincidían con las partidas o estas no permitían confirmarlas. La familia ha decidido lo siguiente:

- Matrimonio de Lucas Calvo Alonso y Felipa Martín Hernández: se registra el 27-03-1822, la fecha de la partida. El 27-04-1822 del documento corresponde a las bendiciones nupciales anotadas al margen, que figuran en `note`.
- Fallecimiento de Manuel Méndez de Paz: se registra el 07-12-1870, porque la partida indica que falleció el día anterior a la sepultura. El 08-12-1870 del documento es la fecha de la sepultura.
- Fallecimientos cuya partida solo da la sepultura: se registra el día anterior, porque la tradición en España es que medie exactamente un día, y `note` conserva la sepultura. Es el caso de Tomasa Tuda Feltrero (31-01-1855, aunque el documento da el 01-02-1855, la fecha de la sepultura), Felipa Martín Hernández (16-10-1834), Esteban Pérez Girón (20-09-1878), Eduviges Sánchez Izquierdo (10-02-1878) y Ángel Celedonio Prada Girón (11-05-1867). Si la partida indica la fecha de la muerte, prevalece esa fecha.

También por decisión de la familia, estas fichas incorporan datos de las fotografías que el documento no recoge:

- Doce fechas de bautismo: las de Lucas Calvo Alonso, Felipa Martín Hernández, Manuel Méndez de Paz, Feliciana Maíllo Morales, Julián Piorno Vega, Tomasa Tuda Feltrero, Carlos Santiago Garrote, María Sastre Esteban, Florencio Brioso Alonso, Eduviges Sánchez Izquierdo, Francisco de las Heras Pascual y Manuela Carretero Bragado. La de Florencio es el día en que se suplieron las ceremonias, porque el cirujano lo había bautizado antes de necesidad.
- Los segundos maridos de Felipa Martín Hernández (Mariano Hernández, en `Muerte de Felipa Martín Hernández.JPG`) y de Manuela Carretero Bragado (Luciano Crespo, en `Manuela Carretero Bragado2.JPG`). Tienen ficha propia y su matrimonio se muestra sin fecha ni lugar.
- El segundo nombre de Josefa Rabanal Ibáñez, que su partida de bautismo escribe «Ygenia». Se conservan esa grafía y su identificador, y la ficha pasa a llamarse Josefa Ygenia Rabanal Ibáñez.

En `TATARABUELOS SEGUNDOS.docx`, las parejas se deducen igualmente por su agrupación y por la fecha y el lugar de su matrimonio. El documento deja en blanco los matrimonios de Tomás de Mena Martín y Valeria Santamaría Ramos, de Manuel de las Heras Domínguez y Josefa Pascual Lorenzo, y de José Rabanal Martínez y Manuela Ibáñez Martín, que se muestran sin fecha ni lugar. Valeria nació en San Marcial en una fecha desconocida: `note` conserva que no existen libros parroquiales de esa época, y no se calcula ningún año. El único bautismo del documento es el de Miguel Pérez Roncero, al día siguiente de su nacimiento. Las causas de fallecimiento se transcriben tal como aparecen, por ejemplo «por consunción», «de repente» o «una fiebre dinámica».

Los lugares entre paréntesis de los sesenta y cuatro padres se indexan con el nombre completo de la localidad: «Casaseca Chanas» y «Casaseca Ch.» como Casaseca de las Chanas, «El Cubo» como El Cubo del Vino y «Pelas de Arriba» como Peleas de Arriba. Manuel Martín Prada nació en Morales del Vino y Antonia Feltrero Gonzalo en Fadón. El lugar que les atribuía `TATARABUELOS PRIMEROS.docx`, Casaseca de las Chanas y Malillos, coincide con el de su matrimonio o su fallecimiento y deja de figurar como lugar de referencia, igual que el de los demás cuando coincide con su nacimiento.

Hay dos mujeres llamadas Inés Martín, con fichas distintas: la madre de María Rosa de las Mercedes Hernández Martín, de Casaseca de las Chanas, y la de Baltasar Brioso Martín, de Morales del Vino. Los identificadores de los sesenta y cuatro padres ya incluían el segundo apellido que les da `TATARABUELOS TERCEROS.docx`, por ejemplo `ines-martin-carrascal` e `ines-martin-marques`, y se conservan al ampliar sus fichas. Ahora se muestran sus nombres completos, Inés Martín Carrascal e Inés Francisca Martín Marqués. La nueva Inés Martín, de Roales, es la madre de Francisco Santos Girón Martín y tiene una ficha independiente: su hijo nació en 1745, antes del nacimiento de Inés Francisca y cuando Inés Martín Carrascal tenía cuatro años.

## Lote TATARABUELOS TERCEROS

Se han comparado los textos completos de las dos versiones facilitadas. La de «Árbol genealógico2» fue modificada el 10-09-2018 y la de «Árbol genealógico/Tatarabuelos terceros», el 10-10-2015, según sus metadatos internos. Se citan como una sola fuente, `TATARABUELOS TERCEROS.docx`, no como dos testimonios independientes. La versión de 2018 añade tres matrimonios, seis fallecimientos y la causa del fallecimiento de Pedro Calvo Pérez; también cambia una fecha de matrimonio. La familia ha confirmado que se use esa fecha de 2018, como se detalla abajo. Las fotografías quedan fuera de este lote y no se han consultado.

Para reconocer estos archivos sin duplicar la fuente, sus SHA-256 son:

| Versión | SHA-256 |
| --- | --- |
| 2018, «Árbol genealógico2» | `e5534919d86b8af3cf0a5422b5220c069894bce014cbde76a2f0c65321130817` |
| 2015, «Tatarabuelos terceros» | `7e3f330102f6f16432e96613f266161577d7dfcb7e280db944987f7a28064dc1` |

Las sesenta y cuatro personas se han cotejado con sus hijos, parejas y localidades, conservando sus identificadores. Los nombres se amplían según la fuente, incluidos María Josefa de Lera Rodríguez, Bonifacio Ruperto de Paz Carrasco, Alonso Vicente Brioso Cabrero, Bernardo Mariano Alonso Cabrero, Joaquina Paula Roncero Hernández, Francisco Santos Girón Martín, Juan Alonso Izquierdo Alcántara y Manuela Vicenta Martínez Juárez. Los padres de Fernando Girón Fernández, «Francisco Girón (Roales) y Josefa Fernández (Muga de Alba)», coinciden con la pareja que ya tenía documentada Margarita Girón Fernández: se reutilizan `francisco-giron-martin` y `josefa-fernandez-de-la-pena`. Sus hijos nacieron en Roales en 1771 y 1779, respectivamente.

Las parejas se identifican por sus hijos, agrupación y eventos coincidentes. Se añaden veinticuatro matrimonios con fecha y lugar, en las fichas de ambos cónyuges; los matrimonios sin esos datos siguen generándose a partir de los hijos documentados. Los nuevos padres solo reciben los nombres y lugares de referencia que aporta el texto. Se conservan las abreviaturas «Ana Mª.» y la lectura «Matías Díez Rabanal (sic)»; en este último nombre, `(sic)` es una indicación del documento y no forma parte del nombre personal.

Los eventos se transcriben con su tipo y precisión. «Falleció» se registra como fallecimiento; este lote no aporta fechas expresas de funeral, entierro ni inscripción. No se aplica a estos documentos la deducción de fallecimiento a partir de sepultura que la familia autorizó para las fotografías del lote anterior. La muerte de Lucas Esteban Prieto tiene fecha, 13-05-1819, pero carece de lugar. Las iglesias se guardan en `note`, sin convertirlas en localidades ni inferir bautismos o sepulturas. Bonifacio nació en Toro, con la lectura «Santo Tomás Canturiense» en la nota; no se añade un bautismo. La ermita del Cristo de Morales de los matrimonios de Manuel Hernández Gaitán e Inés Martín Carrascal se indexa en Morales del Vino, de acuerdo con la [identificación del Ayuntamiento](https://www.moralesdelvino.es/morales-del-vino/).

El nacimiento de Teresa Lorenzo de la Iglesia solo consta como anterior a 1773; su nota conserva ese límite sin asignar `date`. Los fallecimientos de Alonso Santamaría Puertas y Juana Ramos Martín son anteriores a 1869, sin año exacto. La falta de bautismos anteriores a 1837 que se menciona para Alonso describe los libros disponibles, no una fecha de nacimiento o bautismo. Josefa Fernández de la Peña nació en Muga de Alba en fecha desconocida por faltar el libro. El bautismo de Catalina Durán Hernández solo dice «01-10», sin año, y se conserva así en una nota, sin completar 1734. No hay nacimientos calculados a partir de una edad en este lote.

No se atribuye localidad a los bautismos que solo nombran una iglesia: Bernardo Rabanal Fernández, Manuela Vicenta Martínez Juárez, Gabriel Ibáñez Pérez, Manuela Martín Ampudia y Catalina Durán Hernández. Diego de Prada Delgado nació en Torrefrades y fue bautizado expresamente en Torregamones; se conservan las dos localidades distintas. Se normalizan «Casaseca Chanas» y «Casaseca Ch» como Casaseca de las Chanas, «S. Marcial» como San Marcial, «Fresnadillo de Sayago» como Fresnadillo, «El Cubo» como El Cubo del Vino, «Pelas de Arriba» como Peleas de Arriba y «Villardiegua» como Villardiegua de la Ribera, siguiendo las identificaciones ya documentadas.

El lote añade diecisiete lugares al índice, todos con posiciones verificadas y sus URL guardadas en `places.json`. AEMET y PARES respaldan Cabañas de Sayago, Moral de Sayago, Morales de Toro, Moralina, Torregamones, Vegalatrave, Venialbo, Villalobos, Villamor de Cadozos y Villanueva de Campeán. IGN/CNIG CartoCiudad respalda los puntos representativos de La Tuda, Pontejos, Piñuel y Olleros de Tera. Las tres localidades aclaradas por la familia se detallan abajo: AEMET respalda Corrales del Vino y Viana do Bolo; el registro de asentamientos de la Xunta de Galicia respalda San Pedro de Trasverea, de Riós (Ourense). El punto de este último procede del asentamiento, no de su capilla, y se ha transformado de ETRS89/UTM 29N a coordenadas geográficas. Viana do Bolo también pertenece a Ourense; los otros quince lugares nuevos están en Zamora.

### Fechas y lugares confirmados por la familia el 7 de noviembre de 2026

Antes de incorporar estas fechas, las fichas existentes no tenían valores para esos eventos. Se mostraron las discrepancias y la familia decidió conservar literalmente los dos pares de nacimiento y bautismo y usar el matrimonio de la versión de 2018. No se han añadido observaciones a las fichas por estas discrepancias.

| Persona o pareja | Lectura de la fuente | Decisión |
| --- | --- | --- |
| Juana Ramos Martín, MATERNOS 8, ambas versiones | «Nació en Pereruela el 29-06-1783. Fue bautizada en Pereruela el 24-06-1783.» | Se conservan 29-06-1783 y 24-06-1783, aunque el bautismo preceda al nacimiento. |
| Francisco Santos Girón Martín, MATERNOS 11, ambas versiones | «Nació en Roales el 02-11-1745. Fue bautizado en Roales el 10-02-1745.» | Se conservan 02-11-1745 y 10-02-1745, aunque el bautismo preceda al nacimiento. |
| Atilano Pascual Villar y Teresa Lorenzo de la Iglesia, MATERNOS 19–20 | 2015: «Se casó en Abelón el 05-11-1793.»; 2018: «Se casó en Abelón el 23-11-1793.» | Se registra 23-11-1793 en ambas fichas. |

La familia también ha identificado las tres localidades que no se podían situar con seguridad. Se sustituyen las lecturas abreviadas o discrepantes en `origins`, conservando aquí el texto del documento. Son lugares de referencia, no nacimientos atribuidos.

| Persona | Lectura de la fuente | Localidad confirmada por la familia |
| --- | --- | --- |
| Matías Ibáñez, padre de Gabriel, MATERNOS 23 | «Matías Ibáñez (Viana)» | Viana do Bolo (Ourense); sustituido por Viana, Navarra, por decisión familiar en el lote CUARTOS. |
| Agustina Pérez, madre de Gabriel, MATERNOS 23 | «Agustina Pérez (San Pedro de Tráveas)» | San Pedro de Trasverea, Riós (Ourense). |
| Ángela Macías, madre de Pedro Bragado, MATERNOS 31 | «Ángela Macías (Corrales)» | Corrales del Vino (Zamora). |

### Pendientes al cerrar el lote TERCEROS

Al cerrar este lote, la familia pidió dejar pendientes el fallecimiento de Bernardo y las tres identidades repetidas. La tabla conserva el estado de entonces; las identidades de Pedro de Prada, Catalina Cabrero y Lorenzo Roncero se resuelven en el lote CUARTOS, como se detalla más abajo. El fallecimiento de Bernardo sigue sin incorporarse a los eventos ni a las observaciones personales.

| Dato | Valor existente antes del lote | Lectura y contexto de la fuente | Estado |
| --- | --- | --- | --- |
| Fallecimiento de Bernardo Feltrero Esteban | Sin fallecimiento; su hija Antonia Feltrero Gonzalo nació el 12-07-1775 según `TATARABUELOS SEGUNDOS.docx`. | PATERNOS 23, ambas versiones: «Falleció en Fadón el 28-02-1767.» La muerte precedería ocho años al nacimiento de su hija. | Fallecimiento sin incorporar; no se altera el nacimiento de Antonia. |
| Pedro de Prada | No existían fichas ni enlaces para ninguno de los dos padres. | PATERNOS 6: «Pedro de Prada (Morales del Vino) y Luisa Martín (Morales del Vino)», padres de Felipa, nacida en 1750. MATERNOS 25: «Pedro de Prada (Torrefrades) e Inés Delgado (Villamor de Cadozos)», padres de Diego, nacido en 1729. | No se decide si son uno o dos hombres; ambos enlaces paternos quedan pendientes. |
| Catalina Cabrero | No existían fichas ni enlaces para esas madres. | MATERNOS 1: «Baltasar Brioso (Morales del Vino) y Catalina Cabrero (Morales del Vino)», padres de Alonso Vicente, nacido en 1758. MATERNOS 3: «Nicolás Alonso (Moraleja del Vino) y Catalina Cabrero (Morales del Vino)», padres de Bernardo Mariano, nacido en 1761. | No se decide si es una o dos mujeres; ambos enlaces maternos quedan pendientes. |
| Lorenzo Roncero | No existían fichas ni enlaces para esos padres. | MATERNOS 10: «Lorenzo Roncero (Tardobispo) y Dorotea Hernández (Tardobispo)», padres de Joaquina Paula, nacida en 1748. MATERNOS 28: «Lorenzo Roncero (Tardobispo) y Micaela Pérez (Tardobispo)», padres de Francisca, nacida en 1771. | No se decide si es uno o dos hombres; ambos enlaces paternos quedan pendientes. |

No se han añadido transcripciones de partidas que no se hayan facilitado.

## Lote TATARABUELOS CUARTOS

Se han comparado íntegramente las dos versiones facilitadas, con sesenta y cuatro entradas PATERNOS y sesenta y cuatro MATERNOS, referidas a Bernardo Calvo Brioso. La de «Árbol genealógico/Tatarabuelos cuartos» fue modificada el 29-08-2015 y la de «Árbol genealógico2», el 31-08-2018, según sus metadatos internos. Se citan como una sola fuente, `TATARABUELOS CUARTOS.docx`, no como dos testimonios independientes. Las treinta y dos diferencias de texto son complementarias: la versión de 2018 añade ocho matrimonios, once fallecimientos, cuatro lugares de nacimiento y el lugar de referencia de los padres de Andrea Juárez Hernández. Las fotografías quedan fuera de este lote y no se han consultado.

| Versión | SHA-256 |
| --- | --- |
| 2018, «Árbol genealógico2» | `c3b7838980def795d465d018e1e7f4f78748a3f4e994bcf5adfce2ef78b11c20` |
| 2015, «Tatarabuelos cuartos» | `c41f8c7cf07db6ea87a71cf6df5e59259a9b828b62338c78594041a4a4df6c77` |

Las ciento veintiocho entradas corresponden a ciento veintisiete personas distintas, porque Lorenzo Roncero Herrero aparece dos veces. Se amplían ciento veintidós fichas existentes y se crean cinco para las identidades que estaban pendientes en el lote anterior. También se actualizan los enlaces parentales de seis hijos existentes. Los doscientos siete padres nuevos identificados sin ambigüedad elevan el archivo a cuatrocientas sesenta y tres personas y hasta once generaciones conectadas. Se conservan los identificadores anteriores, aunque se amplíen los nombres, entre ellos Ana Francisca Rodríguez Alonso, Francisca Isabel Ocampo Rodríguez, Esteban Vicente Martín Marqués y Jerónimo Juan Pérez Hernández. Francisco Girón Martín es el Francisco Santos Girón Martín ya documentado: conserva su nombre completo, sus fechas confirmadas y una sola ficha, igual que Josefa Fernández de la Peña.

Los lugares anteriores se conservan como referencia si no son redundantes con un nacimiento documentado: por ejemplo, Juan Gonzalo Diego mantiene Fadón y añade su nacimiento en Gáname. Los padres nuevos solo reciben los nombres y lugares inequívocos del texto. No se atribuyen eventos a partir de los lugares entre paréntesis.

### Precisión de los eventos

«Falleció» se transcribe como fallecimiento. El documento no aporta fechas de funeral, sepultura ni inscripción; tampoco edades de las que calcular nacimientos. No se aplica la deducción de muerte a partir de sepultura autorizada para fotografías de otro lote. Los bautismos se registran separados de los nacimientos y no reciben localidad cuando esta no es expresa. S. Sebastián de los Caballeros, Santa María la Nueva, San Juan Bautista, S. Lorenzo, S. Torcuato, S. Antolín y S. Lázaro se conservan en las notas de los eventos correspondientes, sin crear localidades nuevas ni inferir entierros.

El nacimiento de Ana Francisca Rodríguez Alonso solo tiene año, `1719`, y el de Manuel Pérez Roncero solo mes y año, `1706-06`. Los nacimientos anteriores a 1718 de Bernardo Calvo Alonso, a 1773 de Manuela Garrido Magarzo y Juan Lorenzo, y a 1696 de Pedro de Prada de Torrefrades se conservan en notas, sin asignar `date`. Los años de inicio o las lagunas de los libros de Félix Santamaría, Isabel Puertas e Inés Delgado describen la documentación disponible, no fechas de vida ni intervalos de nacimiento.

La entrada PATERNOS 60 tiene el encabezamiento «Ana Delgado Hernández Gáname el 09-02-1750.». La fecha y el lugar finales repiten el matrimonio de Domingo Sastre Esteban y Águeda Gonzalo Gaspar y no se atribuyen a Ana. Se transcriben sus líneas expresas: nacimiento en Fadón el 29-03-1751 y matrimonio allí el 26-01-1775. No se añade una observación personal por este residuo del encabezamiento.

### Decisiones de la familia el 7 de noviembre de 2026

| Dato | Valor anterior o lectura de la fuente | Decisión |
| --- | --- | --- |
| Matías Ibáñez Garralete, MATERNOS 45 | La ficha tenía `origins: Viana do Bolo`, por confirmación familiar del lote anterior. La versión de 2018 dice «Nació en Viana (Navarra)»; la de 2015 deja el nacimiento en blanco. | Se registra el nacimiento en Viana, Navarra, sin fecha, y se retira el lugar de referencia Viana do Bolo. Esta decisión sustituye la identificación anterior para esta persona. La familia confirmó después que el «Viana» de su madre también es Viana, Navarra. |
| Pedro de Prada, PATERNOS 11 y MATERNOS 49 | «Pedro de Prada Martín», nacido en Morales del Vino el 23-05-1708, frente a «Pedro de Prada», nacido en Torrefrades antes de 1696. | Son dos hombres. El primero se enlaza como padre de Felipa de Prada Martín; el segundo, de Diego de Prada Delgado. Se crean dos fichas y se resuelven los dos enlaces pendientes del lote anterior. |
| Catalina Cabrero Marqués, MATERNOS 2 y 6 | La mujer de Baltasar Brioso es hija de «Francisco Cabrero […] e Inés Marqués»; la de Nicolás Alonso, de «Manuel Cabrero y Catalina Marqués». | Son dos mujeres, con fichas distintas y enlaces a Alonso Vicente Brioso Cabrero y Bernardo Mariano Alonso Cabrero, respectivamente. |
| Lorenzo Roncero Herrero, MATERNOS 19 y 55 | Ambas entradas lo hacen hijo de «Manuel Roncero […] y Lucía Herrero»; la primera cita a Dorotea Hernández de la Fuente y la segunda a Micaela Pérez Hernández. | Es un solo hombre. Se reúnen los matrimonios del 20-01-1738 y 17-11-1755 en Tardobispo y los enlaces a Joaquina Paula Roncero Hernández y Francisca Roncero Pérez. Lucía conserva Tardobispo y Pereruela como lugares de referencia, sin atribuir nacimientos. |

### Pendientes de este lote

Las tablas siguientes conservan el estado al cerrar el lote; las identidades se resuelven en el lote QUINTOS, como se detalla en su registro. La familia ha pedido dejar pendientes las tres parejas de fechas y las nuevas menciones repetidas de padres consultadas. Las posibles coincidencias adicionales también se mantienen sin resolver; la familia confirmó que Bernardo Calvo, Juan Gonzalo, Manuel Pérez y Manuel Martín deben seguir pendientes. Las localidades confirmadas se recogen abajo; San Cristóbal sigue sin identificar. No se corrigen fechas, no se deciden identidades por el nombre y no se trasladan las discrepancias a `observations`. Continúa incorporada la información independiente e inequívoca. El fallecimiento de Bernardo Feltrero Esteban del lote TERCEROS sigue pendiente.

Las tres personas siguientes no tenían fechas de nacimiento ni bautismo antes del lote. Se conservan los lugares de nacimiento documentados, pero ninguna de las seis fechas se incorpora mientras no se resuelva el bautismo anterior al nacimiento.

| Persona | Lectura de ambas versiones | Estado |
| --- | --- | --- |
| Lorenzo Feltrero Calles, PATERNOS 45 | «Nació en Fadón el 30-07-1707. Fue bautizado el 10-07-1707.» | Nacimiento y bautismo sin fecha. |
| Esteban Vicente Martín Marqués, MATERNOS 3 | «Nació en Morales del Vino el 02-08-1737. Fue bautizado el 14-02-1737.» | Nacimiento y bautismo sin fecha. |
| Lorenzo Roncero Herrero, MATERNOS 19 | «Nació en Tardobispo el 06-08-1712. Fue bautizado el 18-06-1712.» | Nacimiento y bautismo sin fecha; su identidad única sí está confirmada. |

Las menciones parentales de la tabla siguiente no tenían fichas ni enlaces propios antes de este lote. Cuando existe una posible coincidencia con una ficha enriquecida, se muestra su contexto. Quedan sin incorporar todos los enlaces afectados y no se crean personas adicionales por estas menciones hasta confirmar si se trata de una o varias personas.

| Identidad pendiente | Situación conservada | Lectura y contexto de la fuente |
| --- | --- | --- |
| Isabel Martín | Sin enlaces maternos para María Terrón Martín y José Girón Martín. | PATERNOS 4: «Andrés Terrón e Isabel Martín»; MATERNOS 21: «Manuel Girón e Isabel Martín». |
| María Martín | Sin enlaces maternos para Pedro de Prada Martín y Miguel Martín Martín. | PATERNOS 11: «Francisco de Prada y María Martín»; MATERNOS 47: «Francisco Martín (Chaguazoso, Orense) y María Martín (Venialbo)». |
| Francisco Martín | Sin enlaces paternos para Luisa Martín Izquierdo y Miguel Martín Martín. | PATERNOS 12: «Francisco Martín e Isabel Izquierdo»; MATERNOS 47: «Francisco Martín (Chaguazoso, Orense) y María Martín (Venialbo)». |
| Juan Martín | Sin enlaces paternos para Alonso Martín González, Ana Mª. Martín Rodríguez, Vicente Martín Martín y María Martín Martín. | PATERNOS 15: «Juan Martín y Francisca González»; PATERNOS 18: «Juan Martín y Apolonia Rodríguez»; MATERNOS 11: «Juan Martín (Pontejos) y Jerónima Martín (Pereruela)»; MATERNOS 16: «Juan Martín (Pontejos) y Jerónima Martín (Pontejos)». |
| Jerónima Martín | Sin enlaces maternos para Vicente Martín Martín y María Martín Martín. | MATERNOS 11 la cita de Pereruela; MATERNOS 16, de Pontejos; ambas junto a «Juan Martín (Pontejos)». |
| José Zurdo | Sin enlaces paternos para Sebastiana Zurdo Vega y Bárbara Zurdo Mateo. | PATERNOS 34: «José Zurdo (Gáname) y María Vega (Gáname)»; PATERNOS 64: «José Zurdo (Gáname) y Ana Mateo (Fadón)». |
| Juan Vega | Sin enlaces paternos para Manuel Vega Antón y Ana Mª. Vega Zurdo. | PATERNOS 37: «Juan Vega (Gáname) y María Antón (Gáname)»; PATERNOS 38: «Juan Vega (Gáname) y Josefa Zurdo (Gáname)». Ambos hijos nacieron en Gáname en 1719. |
| Domingo Garrote | Sin enlaces paternos para Teresa Garrote Diego y María Garrote de las Heras. | PATERNOS 50: «Domingo Garrote y Catalina Diego»; PATERNOS 54: «Domingo Garrote y Teresa de las Heras». |
| Juan Pérez | Sin enlaces paternos para Manuel Pérez Roncero y Micaela Pérez Hernández. | MATERNOS 17: «Juan Pérez (Tardobispo) y Luisa Roncero (Tardobispo)»; MATERNOS 56: «Juan Pérez y Teresa Hernández (ambos de Tardobispo)». |
| Teresa Hernández | Sin enlaces maternos para Miguel Izquierdo Hernández y Micaela Pérez Hernández. | MATERNOS 29: «Alonso Izquierdo y Teresa Hernández»; MATERNOS 56: «Juan Pérez y Teresa Hernández (ambos de Tardobispo)». |
| Bernardo Calvo | Bernardo Calvo Alonso tiene nacimiento en Venialbo anterior a 1718, matrimonio con María Pérez Blanco en 1704 y muerte en Villalazán en 1736. Ignacia Calvo Portales sigue sin padre enlazado. | PATERNOS 30: «Bernardo Calvo (Arcenillas) y Manuela Portales (Cazurra)», padres de Ignacia, nacida en 1729. No se decide si coincide con Bernardo Calvo Alonso. |
| Juan Gonzalo | Juan Gonzalo Diego nació en Gáname en 1698 y se casó con Josefa Barrocal Melado en 1735. Águeda Gonzalo Gaspar sigue sin padre enlazado. | PATERNOS 58: «Juan Gonzalo (Gáname) y Sebastiana Gaspar (Fadón)», padres de Águeda, nacida en 1731. No se decide si coincide con Juan Gonzalo Diego. |
| Manuel Pérez | Manuel Pérez Roncero nació en Tardobispo en junio de 1706 y es padre de Juan Pérez Miguel con Ángela Miguel Vara. Jerónima Pérez Luelmo sigue sin padre enlazado. | MATERNOS 12: «Manuel Pérez y Atilana de Luelmo (ambos de Morales del Vino)», padres de Jerónima, nacida en 1745. No se decide si coincide con Manuel Pérez Roncero. |
| Manuel Martín | Sin enlaces paternos para Diego Martín Prieto y Teresa Martín Jorge. | PATERNOS 9: «Manuel Martín (Casaseca de las Chanas) y Luisa Prieto (Pereruela)»; MATERNOS 52: «Manuel Martín y Catalina Jorge (ambos de Villadepera)». No se reutiliza otra ficha solo por el nombre. |
| Alonso Martín | Alonso Martín González nació en Casaseca de las Chanas en 1710 y se casó con Jerónima Carrascal Trigo en 1733. Esteban Vicente Martín Marqués sigue sin padre enlazado. | MATERNOS 3: «Alonso Martín (Morales del Vino) e Isabel Marqués (Morales del Vino)». No se decide si coincide con Alonso Martín González. |
| Francisco Pérez | Francisco Pérez Alonso nació en Casaseca de las Chanas en 1697 y se casó con Teresa Ponce Chico en 1729. Agustina Pérez Vázquez sigue sin padre enlazado. | MATERNOS 46: «Francisco Pérez (S. Pedro de Tráveas) y de María Vázquez (S. Cristóbal Ventas)». No se decide si coincide con Francisco Pérez Alonso. |

Los nombres de los progenitores identificados sin ambigüedad se incorporan aunque su lugar quede pendiente. La familia ha confirmado estas identificaciones geográficas el 7 de noviembre de 2026; las lecturas originales se conservan aquí. Una localidad resuelta no decide por sí sola la identidad de una persona.

| Persona o pareja | Valor anterior y lectura de la fuente | Localidad confirmada y aplicación |
| --- | --- | --- |
| Antonio Ufano, PATERNOS 6 | Sin lugar de referencia; «Antonio Ufano (¿El Perdigón?)». | El Perdigón, Zamora; se incorpora como lugar de referencia. |
| Esteban Vicente Martín Marqués y María Marqués Casaseca, MATERNOS 3–4 | Matrimonio del 29-01-1756 con la lectura literal «Villaseco». | Villaseco del Pan, Zamora; se normaliza el lugar del matrimonio de ambos. |
| Catalina Martínez, MATERNOS 43 | Sin lugar de referencia; «Catalina Martínez (Sever, Orense)». | Sever, municipio de Viana do Bolo, Ourense; se incorpora como lugar de referencia. |
| Marcos Ibáñez, MATERNOS 45 | Sin lugar de referencia; «Marcos Ibáñez (Las Ormazas, Burgos)». | Las Hormazas, Burgos; se incorpora como lugar de referencia municipal. |
| Agustina Garralete, MATERNOS 45 | Sin lugar de referencia; «Agustina Garralete (Viana)». | Viana, Navarra; se incorpora como lugar de referencia. |
| Francisco Martín, MATERNOS 47 | Identidad y enlace paterno pendientes; «Francisco Martín (Chaguazoso, Orense)». | Chaguazoso, municipio de A Mezquita, Ourense. La identificación del lugar queda resuelta, pero no se crea ni se enlaza una persona mientras su identidad siga pendiente. |

María Vázquez, MATERNOS 46, sigue sin lugar de referencia: «María Vázquez (S. Cristóbal Ventas)». La familia no ha podido identificar la localidad y ha pedido dejarla pendiente. No se amplía la abreviatura ni se asignan coordenadas.

### Lugares del lote

Veintitrés localidades o municipios nuevos utilizados tienen coordenadas verificadas y sus URL en `places.json`. AEMET respalda Aguilar de Campos, Bermillo de Sayago, Cazurra, Cármenes, El Perdigón, La Hiniesta, Luelmo, Mansilla de las Mulas, San Miguel de la Ribera, Viana, Villada, Villaescusa y Villardondiego; PARES respalda Argujillo, Muga de Sayago y Sobradillo de Palomares; IGN/CNIG CartoCiudad respalda Figueruela de Abajo, Fuente el Carnero y Tudera; y el Ayuntamiento respalda Villaralbo. Figueruela de Abajo pertenece a Figueruela de Arriba; Fuente el Carnero, a Corrales del Vino; Tudera, a Fariza; y Sobradillo de Palomares, a Pereruela. Se conserva sin uso personal el punto verificado de Viana do Bolo, por si resulta útil en otra fuente.

Tras las aclaraciones familiares, se añaden Villaseco del Pan y Las Hormazas con fuentes de AEMET, y Sever, de Viana do Bolo, con el punto de población de IGN/CNIG CartoCiudad. Las Hormazas se representa mediante el punto oficial de su capital, La Parte; ese punto no atribuye a Marcos Ibáñez una aldea concreta dentro del municipio. También se conserva el punto de Chaguazoso, de A Mezquita, verificado en IGN/CNIG: no apareció en el índice hasta que la familia confirmó la identidad del padre mencionado, con los datos de `TATARABUELOS SEXTOS.docx`.

Se mantienen las identificaciones familiares previas de San Pedro de Trasverea y Corrales del Vino. «S. Miguel de la Rivera» se normaliza como San Miguel de la Ribera; las variantes de Casaseca se indexan como Casaseca de las Chanas. Villaescusa se identifica con el municipio zamorano por el contexto familiar de Fuentesaúco y la proximidad de ambos municipios; la fuente no explicita la provincia. «De Galicia», de Domingo Martínez, se conserva como referencia regional sin coordenadas. Al cerrar este lote, el índice contenía sesenta y ocho referencias de lugar, sesenta y siete de ellas con marcador; solo Galicia carecía de él por ser una referencia regional sin localidad concreta.

### Verificación del lote

Se reconstruyeron los datos con `node familia/build-data.mjs`: 463 personas, 138 apellidos y 68 referencias de lugar. Las 26 pruebas de `node --test familia/tree-layout.test.mjs` pasaron. El cotejo independiente recorrió las 128 entradas, sus fechas y enlaces incorporados; también comprobó contra el estado anterior que no se habían alterado eventos, relaciones ni observaciones existentes. Las seis fechas discutidas y los veintinueve enlaces parentales inciertos siguen sin incorporarse.

Se revisaron las fichas de Lorenzo y Matías, la navegación, el índice y el mapa en el navegador, además de las vistas de escritorio y móvil, sin errores de consola. Solo se modificaron los registros, las coordenadas, este README y los datos generados; el código y el diseño de la web se mantienen.

## Lote TATARABUELOS QUINTOS

Se han comparado íntegramente las dos versiones facilitadas, con ciento veintiocho entradas PATERNOS y ciento veintiocho MATERNOS, referidas a Bernardo Calvo Brioso. La de «Árbol genealógico/Tatarabuelos quintos» fue modificada el 10-10-2015 y la de «Árbol genealógico2», el 04-10-2018, según sus metadatos internos. Se citan como una sola fuente, `TATARABUELOS QUINTOS.docx`. La versión de 2018 completa ciento diecisiete datos que la de 2015 deja en blanco: segundos apellidos, nacimientos, matrimonios, fallecimientos y padres. También resuelve la duda «¿Lozano o Coralin?» de 2015 a favor de Lozano, que se incorpora a Apolonia Rodríguez Lozano y a su madre, Francisca Lozano. En cambio, deja en blanco once datos de 2015, que la familia decidió incorporar después, y cambia algunos nombres e identidades, que se recogen abajo. Las fotografías de la carpeta del lote quedan para una revisión posterior y no se han consultado.

| Versión | SHA-256 |
| --- | --- |
| 2018, «Árbol genealógico2» | `841f38f33295f9a24ab105de0950fd37b1dc13319dbf716b5c55b90afa97910e` |
| 2015, «Tatarabuelos quintos» | `cad29e84239f03f4954b927b7e51d248b64bd61bb9aa19e26c8720b5dde03e17` |

Las entradas siguen el orden de las del lote anterior: PATERNOS 1 y 2 son los padres de la entrada PATERNOS 1 de `TATARABUELOS CUARTOS.docx`, y así sucesivamente. PATERNOS 51–52 y MATERNOS 9–10 y 105–108 repiten personas ya documentadas en otra posición del árbol, y MATERNOS 109–110 repite a la pareja de MATERNOS 37–38; cada una conserva una sola ficha, que añade la fuente. Diez entradas están en blanco en las dos versiones: MATERNOS 25–28, 77–78 y 97–100.

### Datos incorporados

Se amplían ciento noventa y una fichas existentes con los datos expresos de la fuente: ciento treinta y un nombres completos, ciento sesenta y siete nacimientos, ciento cinco de ellos con fecha, noventa y seis fallecimientos y treinta y nueve matrimonios, registrados en las fichas de ambos cónyuges. Se conservan los identificadores y los nombres de pila existentes, como «Ana María» y «María Antonia», aunque el documento abrevie «Mª.». El lugar de referencia anterior se retira cuando coincide con el nacimiento documentado, como en los lotes anteriores; se mantiene cuando es distinto, como Villardondiego en Jacinta Blanco Chillón, nacida en Villalazán.

Los padres que nombran las líneas «Era hijo de» o «Era hija de» dan lugar a doscientas cincuenta y una fichas nuevas, con su nombre y los lugares de referencia del texto, sin eventos. Un lugar entre paréntesis se aplica a la persona a la que sigue, «ambos de» a los dos y «vecinos de», como lugar de referencia, igual que «vecino de Venialbo» en el lote anterior. Una pareja repetida con los mismos lugares es una sola: Marcos Vega e Isabel Salvador, padres de María, Juan y José Vega Salvador; Bartolomé Garrote e Inés Andrés, padres de Marcos y Domingo Garrote Andrés; Juan Roncero y María Hernández, padres de Luisa y Manuel Roncero Hernández, y Francisco Herrero y Teresa Ruiz.

Las personas del mismo nombre de localidades distintas y con cónyuges distintos se tratan como personas diferentes. Es el caso de los dos Juan de Luelmo, de Morales del Vino y Moraleja del Vino; las dos María Coscarón, de Luelmo y Abelón; los dos Andrés Fernández, de San Martín de Tábara y Aguilar de Campos, o las tres Ana Hernández, de Sanzoles, Pereruela y Fadón. Los homónimos de la misma localidad quedan pendientes, como se detalla abajo. Cuando el nombre coincide con el de otra ficha, el identificador nuevo indica el hijo, por ejemplo `isabel-montalvo-madre-de-miguel-avedillo`; el padre de María Pérez Santiago es `miguel-perez-padre-de-maria-perez-santiago`.

### Precisión de los eventos

Los nacimientos situados «antes de» un libro conservado se registran sin fecha y conservan la lectura en la nota: Pedro Calvo y Antonia Alonso, antes de 1718; Francisco Zamora García y Margarita de Luelmo Nieto, antes de 1662; Pedro Garrido y Ana Mª. Magarzo, antes de 1773; Alonso Esteban, antes de 1696, «en que es confirmado», y Ana Mateo Hernández, antes de 1702. El matrimonio y el fallecimiento de Pedro Calvo y Antonia Alonso, en Venialbo antes de 1757, se registran del mismo modo. «¿-¿-1709» se registra como el año 1709, en María Pérez Santiago, y no se completa el día ni el mes. Luisa Prieto falleció el 27-11-1719, sin lugar. Las parroquias de Toro y Fuentesaúco se conservan en la nota del nacimiento, por ejemplo «La fuente indica «Toro (Santo Sepulcro)»», sin crear localidades. No hay bautismos expresos, inscripciones ni nacimientos calculados a partir de edades.

La fuente solo da una sepultura expresa sin conflicto: Manuel Roncero Hernández falleció el 19-07-1738 y fue enterrado en Tardobispo al día siguiente, como figura en la nota de su fallecimiento. No ha sido necesario deducir ningún fallecimiento a partir de una sepultura.

### Lugares del lote

Ocho localidades nuevas se incorporan al índice, con puntos representativos de IGN/CNIG CartoCiudad y sus URL en `places.json`:

- Rábano de Sanabria, del municipio de San Justo.
- Casaseca de Campeán.
- Cernecina, de Pereruela; la fuente escribe «La Cernecina».
- Valcabado.
- San Martín de Tábara, de Olmillos de Castro.
- Carrascal, del municipio de Zamora. Es la única localidad con ese nombre en la provincia y está a unos nueve kilómetros de Pereruela, donde se casó la hija de José Santiago y Mariana Rodríguez.
- La Peña (Salamanca), que la fuente identifica con su provincia.
- Arcenillas, con Bernardo Calvo Martín y sus padres, que la familia confirmó después.

Tamame (Peñausende), Galende y Salce también estaban verificados, pero solo aparecían en datos pendientes y no figuraban en el índice; Salce y Galende se incorporan en el lote SEXTOS. Las demás lecturas se indexan con las identificaciones ya documentadas, entre ellas «Cármenes (León)», «Sever (Orense)», «Las Ormazas (Burgos)», «Viana», «Corrales», «Fuentelcarnero», «S. Miguel de la Ribera», «El Cubo», «Villanueva Campeán» y «Fresnadillo de Sayago». La Torre del Salinar se añadió después por indicación de la familia, como se explica abajo. Al cerrar este lote, el índice contenía setenta y siete referencias de lugar, setenta y seis de ellas con marcador.

### Identidades confirmadas por la familia el 7 de noviembre de 2026

`TATARABUELOS QUINTOS.docx` aporta datos propios para las dieciséis identidades que el lote anterior dejó pendientes. La familia confirmó la propuesta completa, que se incorpora con los mismos criterios que el resto del lote. Se añaden veintiséis fichas con sus eventos y treinta y dos padres sin dudas de identidad, se enlaza a Águeda Gonzalo Gaspar con la ficha existente de Juan Gonzalo Diego y los matrimonios figuran en las fichas de ambos cónyuges. Las fichas nuevas citan `TATARABUELOS QUINTOS.docx`; los hijos enlazados conservan su fuente, como en el lote anterior.

| Identidad | Lectura de la fuente | Decisión |
| --- | --- | --- |
| Isabel Martín | PATERNOS 8: «Isabel Martín Delgado», nacida en Sanzoles el 18-05-1658, hija de Domingo Martín e Isabel Delgado. MATERNOS 42: «Isabel Martín Díez», nacida en Roales el 04-10-1673, hija de Francisco Martín y María Díez. | Dos mujeres, madres de María Terrón Martín y de José Girón Martín. |
| María Martín | PATERNOS 22: «María Martín Nieto», nacida en Morales del Vino el 30-01-1679, hija de Pedro Martín y María Nieto; la versión de 2015 la llama «María Martín Prieto». MATERNOS 94: «María Martín Hernández», hija de Juan Martín y Ángela Hernández (ambos de Venialbo). | Dos mujeres, madres de Pedro de Prada Martín y de Miguel Martín Martín. Se usa «Nieto», el apellido de la madre en las dos versiones. |
| Francisco Martín | PATERNOS 23: «Francisco Martín Cabrero», hijo de Juan Martín y Lorenza Cabrero. MATERNOS 93: «Francisco Martín Rodríguez», hijo de Francisco Martín y María Rodríguez (ambos de Chaguazoso (Orense)). | Dos hombres, padres de Luisa Martín Izquierdo y de Miguel Martín Martín. |
| Juan Martín | PATERNOS 29: «Juan Martín Hernández», nacido en Sanzoles el 22-11-1683 y casado el 21-01-1697. PATERNOS 35: «Juan Martín», nacido en San Marcial. MATERNOS 21 y 31: «Juan Martín Bambón», nacido en Pontejos el 08-09-1697, con los mismos datos en las dos entradas. | Tres hombres; el de Pontejos es el padre de Vicente y de María Martín Martín. |
| Jerónima Martín | MATERNOS 22 y 32: «Jerónima Martín Rodríguez», hija de Francisco Martín (Morales del Vino) y María Rodríguez (Pereruela). | Una mujer, madre de Vicente (1744) y María (1746). |
| José Zurdo | PATERNOS 67: «José Zurdo Mayordomo», nacido en Gáname el 09-05-1695. PATERNOS 127: «José Zurdo Herrero», nacido en Gáname el 10-09-1699. | Dos hombres, padres de Sebastiana Zurdo Vega y de Bárbara Zurdo Mateo. |
| Juan Vega | PATERNOS 73: «Juan Vega Rodrigo», hijo de Juan Vega y Magdalena Rodrigo. PATERNOS 75: «Juan Vega Salvador», nacido en Gáname el 07-01-1691, hijo de Marcos Vega e Isabel Salvador. | Dos hombres, padres de Manuel Vega Antón y de Ana Mª. Vega Zurdo. |
| Domingo Garrote | PATERNOS 99: «Domingo Garrote Ortijo», nacido en Abelón el 11-08-1681. PATERNOS 107: «Domingo Garrote Andrés», nacido en Abelón el 30-04-1689. | Dos hombres, padres de Teresa Garrote Diego y de María Garrote de las Heras. |
| Juan Pérez | MATERNOS 33: «Juan Pérez Martín», nacido en Tardobispo el 16-11-1678 y fallecido en 1711. MATERNOS 111: «Juan Pérez de la Iglesia», nacido en Tardobispo el 10-04-1702. | Dos hombres, padres de Manuel Pérez Roncero y de Micaela Pérez Hernández. |
| Teresa Hernández | MATERNOS 58: «Teresa Hernández», fallecida en El Cubo del Vino el 15-11-1700. MATERNOS 112: «Teresa Hernández Hernández», nacida en Tardobispo el 17-10-1709. | Dos mujeres, madres de Miguel Izquierdo Hernández y de Micaela Pérez Hernández. |
| Bernardo Calvo | PATERNOS 59: «Bernardo Calvo Martín», nacido en Arcenillas el 09-02-1670, hijo de Francisco Calvo y Ana Martín, fallecido en Casaseca de las Chanas en 1742. | Distinto de Bernardo Calvo Alonso; padre de Ignacia Calvo Portales. |
| Juan Gonzalo | PATERNOS 115: «Juan Gonzalo Diego», nacido en Gáname el 11-09-1698, hijo de Blas Gonzalo y Emerenciana Diego, casado en Gáname el 04-05-1730 con Sebastiana Gaspar Piorno, fallecida el 06-01-1735. | La ficha existente de Juan Gonzalo Diego, con la misma fecha de nacimiento y los mismos padres; padre de Águeda Gonzalo Gaspar. Su ficha reúne los dos matrimonios. |
| Manuel Pérez | MATERNOS 23: «Manuel Pérez Carrascal», nacido en Morales del Vino el 15-04-1724. | Distinto de Manuel Pérez Roncero, nacido en 1706; padre de Jerónima Pérez Luelmo. |
| Manuel Martín | PATERNOS 17: «Manuel Martín», nacido y fallecido en Moraleja del Vino, el 01-01-1726. MATERNOS 103: «Manuel Martín», casado en Villadepera el 08-05-1707 con Catalina Jorge Santos. | Dos hombres, padres de Diego Martín Prieto y de Teresa Martín Jorge. |
| Alonso Martín | MATERNOS 5: «Alonso Martín Brioso», nacido en Morales del Vino el 14-12-1708, hijo de Luis Martín e Inés Brioso. | Distinto de Alonso Martín González; padre de Esteban Vicente Martín Marqués. |
| Francisco Pérez | MATERNOS 91: «Francisco Pérez», nacido en San Pedro de Tráveas (Orense), que se indexa como San Pedro de Trasverea. | Distinto de Francisco Pérez Alonso; padre de Agustina Pérez Vázquez. |

Algunos datos de estas personas siguen pendientes y figuran en las tablas siguientes: el fallecimiento de Jerónima en 1724, las fechas de nacimiento y boda de Juan Martín Hernández, los padres de Jerónima y de Francisco Martín Rodríguez, el padre de cada uno de los dos Juan Pérez y los lugares de los padres de José Zurdo Herrero.

### Decisiones de la familia el 8 de noviembre de 2026

La familia decidió incorporar los datos que solo recoge la versión de 2015 y que la de 2018 deja en blanco. Cada evento lleva la nota «Según la versión de 2015.», y los matrimonios figuran en las fichas de ambos cónyuges.

| Persona o pareja | Lectura de 2015 | Evento incorporado |
| --- | --- | --- |
| Marcos Garrote Andrés, PATERNOS 105 | «Falleció en Abelón el 19-04-1733.» | Fallecimiento. |
| Domingo Garrote Andrés, PATERNOS 107 | «Falleció en Abelón el 14-01-1724.» | Fallecimiento. |
| Andrés Antón Gaitán y María Almaraz Rodrigo, PATERNOS 109–110 | «Se casó en Fresnadillo de Sayago el 01-03-1707.» | Matrimonio en Fresnadillo. |
| José Domínguez y Emerenciana Blanco Sesma, MATERNOS 69–70 | «Se casó en Abelón el 20-05-1733.» | Matrimonio. |
| Santiago Martín Bartolo y Antonia Pérez Cabrero, MATERNOS 71–72 | «Se casó en Abelón el 28-01-1731»; de ella, «Falleció en Abelón 07-03-1789». | Matrimonio y fallecimiento de Antonia. |
| Domingo Villar y Mariana Ortizo Benito, MATERNOS 75–76 | «Se casó en Abelón el 27-06-1736.» | Matrimonio. |

La Torre del Salinar, lugar de referencia de Dorotea de la Iglesia (MATERNOS 40), es un pueblo que ya no existe. Por indicación de la familia, su marcador se sitúa en el punto representativo de Entrala (Zamora), tomado de IGN/CNIG CartoCiudad. El marcador no indica la posición exacta del antiguo pueblo, igual que el de Las Hormazas no indica una aldea concreta.

Las anotaciones del documento se incorporan a las fichas a petición de la familia. La de Isabel Fernández se refiere a su propia defunción y figura en la nota de ese evento. Las demás no corresponden a un evento de la persona y figuran en sus observaciones.

| Persona | Anotación de la fuente | Ubicación |
| --- | --- | --- |
| Isabel Fernández, PATERNOS 82 | «en la defunción pone Hernández» | Nota del fallecimiento. |
| María Hernández Pereruela, PATERNOS 84 | «En la defunción del marido la apellida Fernández» | Observaciones. |
| Santiago Martín Bartolo, MATERNOS 71 | «aparece también Martínez» | Observaciones. |
| María Hernández, madre de Manuel Roncero Hernández, MATERNOS 109 | «en Bautismo aparece Fernández» | Observaciones. |
| Juan de Luelmo, padre de Margarita de Luelmo Nieto, PATERNOS 16 | «Juan de Luelmo (del huelmo)» | Observaciones. |
| Juan Pérez, padre de Emerenciana Pérez Garzón, PATERNOS 10 | «Juan Pérez “El Mozo”» | Observaciones. |
| Domingo Jorge, padre de Catalina Jorge Santos, MATERNOS 104 | «Domingo Jorge “El Mozo”» | Observaciones. |

Las anotaciones que forman parte de un nombre en discusión, como «Aparece a veces el apellido Hernández» de Sebastiana Hernández Vega, siguen en la tabla de diferencias de nombre.

### Pendientes de este lote

Ninguno de estos casos modifica valores existentes ni se ha trasladado a `observations`. Las decisiones quedan a cargo de la familia. Las tablas conservan el estado al cerrar el lote. El 8 de noviembre de 2026, con los datos de `TATARABUELOS SEXTOS.docx`, la familia resolvió el segundo apellido y la madre de Joaquín Sastre, Gabriel Martín y Esteban Carretero; el segundo apellido y los padres de María Marqués, con lo que se identifica también el padre de Manuel Marqués Esteban; el nombre y los padres de Manuel Hernández Crespo; el padre de Sebastiana Hernández Vega; el segundo apellido de Juana Miguel; el lugar de nacimiento de los padres de José Zurdo Herrero, y los homónimos Juan Rodríguez, María Luelmo, José Pérez, Alonso Esteban y Francisco Martín y María Rodríguez, como se detalla en el registro de ese lote.

#### Fechas contradictorias o condicionadas

| Persona | Lectura de la fuente | Problema | Estado |
| --- | --- | --- | --- |
| Ana Hernández, PATERNOS 6 | «Falleció en Sanzoles el 30-11-1677.» | Su hijo Pedro Salvador Hernández nació el 14-09-1679. | Fallecimiento sin incorporar. |
| Francisco Alonso Pérez y Emerenciana Pérez Garzón, PATERNOS 9–10 | «Nació en Casaseca de las Chanas el año 1653»; «Nació en Casaseca de las Chanas el 28-03-1653»; «Se casó en Casaseca de las Chanas el 27-11-1663». | Se habrían casado a los diez años; su hijo Manuel nació en 1684. | Se registran los lugares, sin las tres fechas. |
| Alonso Piorno Zurdo, PATERNOS 65 | «Falleció en Tamame y fue enterrado en Gáname el 12-05-1705.» | Su hijo Manuel Piorno Garrote nació el 17-11-1708. | Fallecimiento y sepultura sin incorporar. |
| Bernardo Hernández Bragado y Francisca de la Fuente de la Iglesia, MATERNOS 39–40 | «Se casó en Tardobispo el 25-06-1717.» | Su hija Dorotea nació el 15-09-1714. | Matrimonio en Tardobispo, sin fecha. |
| Manuel Roncero Hernández, MATERNOS 37 y 109 | 37: «Falleció en Zamora el 19-07-1738, pero fue enterrado en Tardobispo el día 20.» 109: «Falleció en Tardobispo el 19-07-1738.» | Lugar del fallecimiento. | Fecha y sepultura incorporadas; lugar pendiente. |
| Juan Feltrero, PATERNOS 89 | «Falleció en Fadón el 11-02-1725 (si se casó de segundas nupcias con María Ramírez)». | La propia fuente condiciona la identificación. | Sin incorporar. |
| Jerónima Martín Rodríguez, MATERNOS 32 | «Falleció en Morales del Vino el 17-12-1724.» | Sus hijos Vicente y María nacieron en 1744 y 1746. | Fallecimiento sin incorporar. |
| Juan Martín Hernández, PATERNOS 29 | «Nació en Sanzoles el 22-11-1683»; «Se casó en Casaseca de las Chanas el 21-01-1697». | Se habría casado a los trece años. | Se registran los lugares, sin las dos fechas. |

#### Lugares que cambian entre versiones

Los padres de José Zurdo Herrero, Manuel Zurdo y María Herrero, figuran «(Fadón)» en la versión de 2015 y «(Gáname)» en la de 2018. Se incorporan sin lugar de referencia.

#### Diferencias de nombre

| Ficha | Valor actual | Lectura de la fuente | Estado |
| --- | --- | --- | --- |
| `manuel-hernandez-crespo` | Manuel Hernández Crespo, según `TATARABUELOS CUARTOS.docx`. | PATERNOS 25, ambas versiones: «Manuel Hernández Prieto», nacido el 20-12-1655, «hijo de Lucas Hernández y Susana Prieto». | Se mantiene el nombre y se incorporan el matrimonio y el fallecimiento; el nacimiento y los padres quedan pendientes. |
| `josefa-rivera` | Josefa Rivera | MATERNOS 122: «Josefa Rivero»; su hijo es Francisco Bragado Rivero. | Se mantiene el nombre y se incorpora el nacimiento. |
| `joaquin-sastre` | Joaquín Sastre | 2018: «Joaquín Sastre Bartolo», hijo de «Catalina Bartolo»; 2015: «Bartolomé». | Sin segundo apellido ni madre; se incorporan el nacimiento, el fallecimiento y el padre. |
| `gabriel-martin` | Gabriel Martín | 2018: «Gabriel Martín Villasante», hijo de «Antonia Villasante»; 2015: «Villasanta». | Igual que el caso anterior. |
| `esteban-carretero` | Esteban Carretero | 2018: «Esteban Carretero Arias», hijo de «María Arias»; 2015: «Aries». | Igual que el caso anterior. |
| `sebastiana-hernandez` | Sebastiana Hernández | 2018: «Sebastiana Fernández Vega (Aparece a veces el apellido Hernández)», hija de «Domingo Fernández (Galende)»; 2015: «Sebastiana Hernández Vega», hija de «Domingo Hernández (Galende)». | Se registra como Sebastiana Hernández Vega, con su fallecimiento y su madre; el padre queda pendiente. |
| `maria-marques-madre-de-baltasar-brioso` | María Marqués | 2018: «María Marqués Esteban», hija de «Juan Marqués y María Esteban (ambos de Morales del Vino)». 2015: «María Marqués Herrero», nacida el 24-06-1701, hija de «Manuel Marqués, “El Mozo” y Francisca Herrero». Con esa fecha se habría casado a los siete años, en 1708. | Se incorporan el nacimiento en Morales del Vino, el matrimonio y el fallecimiento; el segundo apellido, la fecha de nacimiento y los padres quedan pendientes. |
| `juana-miguel` | Juana Miguel | 2018: «Juana Miguel de Trigo», hija de «Juan Miguel e Inés de Trigo». 2015: «Juana Miguel Ufano», nacida el 16-02-1702, hija de «Juan Miguel y Jacinta Ufano». | Se incorporan el nacimiento en Morales del Vino, el matrimonio, el fallecimiento y el padre, Juan Miguel; el segundo apellido y la madre quedan pendientes. |
| `margarita-de-luelmo`, `manuel-de-carrascal` y `juan-de-alcantara` | Margarita de Luelmo, Manuel de Carrascal y Juan de Alcántara | Encabezados «Margarita Luelmo Nieto», «Manuel Carrascal Bragado» y «Juan Alcántara Lucas». | Se conserva la partícula «de» y se añade el segundo apellido. |
| `tomas-ocampo` | Tomás Ocampo | 2018: «Tomás ¿Fernández del Campo o Tomás Ocampo?»; 2015: «Tomás Ocampo». | Se mantiene el nombre y se incorpora el nacimiento en Pereruela. |

#### Homónimos de la misma localidad

Los padres siguientes no se crean ni se enlazan mientras no se confirme si son una o varias personas.

| Nombre | Menciones | Estado |
| --- | --- | --- |
| Alonso Esteban | PATERNOS 114: padre de Josefa Esteban Simón, nacida en Villamor de la Ladre en 1690, y marido de María Simón. La ficha existente de Alonso Esteban se casó en Villamor de la Ladre en 1706 con Ana Melado. | Sin enlace paterno. |
| Ana Melado | MATERNOS 74: «Ana Melado (Salce)», mujer de Miguel Esteban y madre de Micaela Esteban Melado. La ficha existente, nacida en Bermillo de Sayago, es la mujer de Alonso Esteban. | Sin enlace materno; Miguel Esteban sí se incorpora. |
| Juan Marqués | MATERNOS 7: con María Esteban, padre de Manuel Marqués Esteban, nacido en 1689. MATERNOS 12: con Luisa Portales, padre de Catalina Marqués Portales, nacida en 1703. Ambos hijos son de Morales del Vino. | Sin enlaces paternos; las madres sí se incorporan. |
| Juan Rodríguez | PATERNOS 53: con Úrsula Martín, padre de Alonso, nacido en 1678. PATERNOS 39: con Francisca Méndez, padre de Miguel, nacido en 1681. PATERNOS 28: con Teodora Alonso, padre de Isabel. Los tres hijos son de Casaseca de las Chanas. | Sin enlaces paternos; las madres sí se incorporan. |
| María Luelmo o de Luelmo | PATERNOS 32: mujer de Alonso de Trigo y madre de Inés, nacida en 1671. MATERNOS 1: mujer de Francisco Brioso y madre de Juan, nacido en 1683. MATERNOS 11: mujer de Juan Cabrero y madre de Manuel, nacido en 1693. Los tres hijos son de Morales del Vino. | Sin enlaces maternos; los padres sí se incorporan. |
| José Pérez | MATERNOS 33: «José Pérez (Tardobispo)», marido de Isabel Martín (El Perdigón) y padre de Juan Pérez Martín, nacido en 1678. MATERNOS 111: «José Pérez», marido de Manuela de la Iglesia y padre de Juan Pérez de la Iglesia, nacido en Tardobispo en 1702. | Sin enlaces paternos; las madres sí se incorporan. |
| Francisco Martín y María Rodríguez | MATERNOS 22 y 32: «Francisco Martín (Morales del Vino) y María Rodríguez (Pereruela)», padres de Jerónima Martín Rodríguez. MATERNOS 93: «Francisco Martín y María Rodríguez (ambos de Chaguazoso (Orense))», padres de Francisco Martín Rodríguez. María Rodríguez Hernández, ya en el archivo, nació en Pereruela en 1680 y se casó con Tomás Ocampo. | La misma pareja de nombres con lugares distintos; Jerónima y Francisco Martín Rodríguez quedan sin padres enlazados. |

#### Localidades sin identificar

| Lectura | Persona | Estado |
| --- | --- | --- |
| «Frieras» | Isabel Hernández, madre de Andrea Juárez Hernández, MATERNOS 88 | Puede ser Frieras (Llanes, Asturias), Friera de Valverde (Zamora) u otra localidad. Nacimiento sin incorporar. |
| «San Cristóbal de las Ventas (Orense)» | María Vázquez, MATERNOS 92 | Nueva lectura, con provincia, de la localidad que el lote anterior dejó pendiente («S. Cristóbal Ventas»). Sigue sin identificarse; nacimiento sin incorporar. |

### Verificación del lote

Se reconstruyeron los datos con `node familia/build-data.mjs`: 772 personas, 185 apellidos y 77 referencias de lugar. Las 26 pruebas de `node --test familia/tree-layout.test.mjs` pasaron. Un cotejo independiente con el texto de 2018 comprobó que cada fecha y cada lugar añadidos figuran en la entrada correspondiente, y que los nombres nuevos y sus lugares figuran en las líneas de padres. Las identidades confirmadas se cotejaron del mismo modo: sus nombres figuran en el encabezado de su entrada, sus fechas y lugares en el texto, sus matrimonios son iguales en las fichas de ambos cónyuges y los datos pendientes no figuran en las fichas. También comprobó que no se ha alterado ningún valor existente, salvo para ampliar nombres y retirar lugares de referencia que coinciden con el nacimiento. Las únicas observaciones nuevas son las anotaciones de la fuente que la familia pidió incorporar. Una revisión de coherencia de fechas no encontró contradicciones nuevas: bautismos anteriores al nacimiento, padres demasiado jóvenes, nacimientos posteriores a la muerte de un progenitor o bodas antes de los doce años.

Se revisaron en el navegador varias fichas, la pestaña de lugares, el mapa y la vista móvil, sin errores de consola. Solo se modificaron los registros, las coordenadas, este README y los datos generados; el código y el diseño de la web se mantienen.

## Lote TATARABUELOS SEXTOS

Se han comparado íntegramente las tres versiones facilitadas, con doscientas cincuenta y seis entradas PATERNOS y doscientas cincuenta y seis MATERNOS, referidas a Bernardo Calvo Brioso. La de «Árbol genealógico/Tatarabuelos sextos», modificada el 16-07-2015 según sus metadatos internos, es una plantilla: numera las quinientas doce entradas, pero todas están en blanco. En «Árbol genealógico2», el archivo .docx fue modificado el 04-10-2018 y el .odt, el 09-03-2019. Se citan como una sola fuente, `TATARABUELOS SEXTOS.docx`, como en los lotes anteriores, y la transcripción sigue el archivo .odt, el más reciente y completo. Este añade a la versión de 2018 cuatro matrimonios, en las entradas de ambos cónyuges, diecinueve fallecimientos, uno de ellos sin fecha, tres fechas de nacimiento, el segundo apellido de tres personas y los padres de Manuel Martín Alonso en su segunda entrada, y corrige «Casaseca de las Chans». También cambia tres nombres y los padres de Josefa Rodríguez, que se recogen abajo. Las fotografías de la carpeta del lote quedan para una revisión posterior y no se han consultado.

| Versión | SHA-256 |
| --- | --- |
| 2019, «Árbol genealógico2», .odt | `19e4331670c473c2076d6618fe53ae36417c1c17dc1e3560523dc4b648a72702` |
| 2018, «Árbol genealógico2», .docx | `cfb4d9acc2b8e551e09fb84e8c7f01139857b6f03549f1308d56f485f7612c22` |
| 2015, «Tatarabuelos sextos», .docx | `e983b6d78a6b15cdc06913d92dbd910e56d0f4ff4ac6c23e700ab1a93b348b8b` |

Las entradas siguen el orden de las del lote anterior: PATERNOS 1 y 2 son los padres de la entrada PATERNOS 1 de `TATARABUELOS QUINTOS.docx`, y así sucesivamente. Trescientas treinta y cinco entradas tienen nombre. De las demás, PATERNOS 1–4 indican que no hay libros de Venialbo de esos años y PATERNOS 69–70, que no los hay de San Marcial; otras ochenta y tres solo repiten la localidad del hijo, como «Nació en Sanzoles», y no crean personas ni lugares. Así, MATERNOS 209–216 corresponden a los padres de José Girón, Inés Martín, José Fernández y María de la Peña, ya documentados en otra posición del árbol, y su «Roales» contradiría el nacimiento de Basilisa Sánchez Martín en La Hiniesta. Diez personas aparecen en varias entradas, como Marcos Vega e Isabel Salvador o Juan Roncero y María Hernández; cada una conserva una sola ficha.

### Datos incorporados

Se amplían doscientas ochenta y cuatro fichas existentes con los datos expresos de la fuente: noventa y seis nombres completos, doscientos ochenta nacimientos, ochenta y siete de ellos con fecha, la fecha del nacimiento de Isabel Rodríguez Alonso, noventa y siete fallecimientos y treinta y cinco matrimonios, registrados en las fichas de ambos cónyuges. El matrimonio de Antonio Piorno y Ana Zurdo solo tiene lugar, Gáname, igual que el de Juan Martín Esteban y Lorenza Cabrero, en Morales del Vino, cuya fecha es imposible. Se conservan los identificadores. El lugar de referencia anterior se retira cuando coincide con el nacimiento documentado, en noventa y dos casos, y se mantiene cuando es distinto, como Fadón en Alonso Mateo y Ana Hernández, nacidos en Gáname. Ana Martín pasa a llamarse Ana Mª. Martín Jambrina, con la abreviatura de la fuente, como Ana Mª. Bambón y las demás fichas creadas con esa forma en el lote anterior.

Los padres que nombran las líneas «Era hijo de» o «Era hija de» dan lugar a ciento ochenta y tres fichas nuevas, con su nombre y los lugares de referencia del texto, sin eventos. Una pareja repetida con los mismos datos es una sola: Juan Garrote y Catalina Gabriel, padres de Pedro y Bartolomé Garrote Gabriel; Pedro Almaraz y María Bernabé, padres de Santiago y Francisco Almaraz Bernabé, y Miguel Delgado e Isabel Martín, padres de Josefa e Isabel Delgado Martín. Cuando la pareja nombrada ya tiene ficha en la misma localidad y sus fechas son compatibles, se enlaza con ella:

| Hijo | Lectura de la fuente | Pareja enlazada |
| --- | --- | --- |
| Francisca Méndez Madaleno, nacida en 1655, PATERNOS 78 | «Juan Méndez y de María Madaleno» | Juan Méndez Martín y María Madaleno Rubio, de Casaseca de las Chanas, padres de Luis Méndez Madaleno (1669). |
| Manuel Alonso Pérez, nacido en 1656, PATERNOS 79 | «Luis Alonso y Susana Pérez» | Luis Alonso y Susana Pérez, casados en Casaseca de las Chanas en 1653, padres de Francisco Alonso Pérez. |
| Luis Martín Nieto, nacido en 1676, MATERNOS 9 | «Pedro Martín y de María Nieto» | Pedro Martín Cordero y María Nieto Nieto, de Morales del Vino, padres de María Martín Nieto (1679). |
| María Carrascal de Trigo, nacida en 1701, MATERNOS 46 | «Manuel Carrascal y de Inés de Trigo» | Manuel de Carrascal Bragado e Inés de Trigo Luelmo, casados en Morales del Vino en 1695, padres de Jerónima Carrascal Trigo (1705). |
| Inés Brioso Luelmo, nacida en 1673, MATERNOS 10 | «Francisco Brioso y de María de Luelmo» | Francisco Brioso Carrascal, padre de Juan Brioso Luelmo (1683), que según MATERNOS 1–2 se casó con María de Luelmo en Morales del Vino el 04-02-1671. La madre queda pendiente, con las demás María de Luelmo. |

El enlace de María Carrascal de Trigo une dos ramas: Manuel de Carrascal Bragado e Inés de Trigo Luelmo ya figuraban entre los antepasados de Nicanor Calvo Piorno y pasan a serlo también de Rosario Brioso de las Heras.

Las personas del mismo nombre se distinguen como en el lote anterior: si son de localidades distintas y tienen cónyuges distintos, son personas diferentes; si son de la misma localidad, quedan pendientes, salvo que las fechas impidan que sean la misma persona. Ocurre cuando el homónimo es el hijo o el nieto de la persona nombrada, como Luis Gaitán, padre de Domingo Gaitán Hernández (1642) y abuelo de Luis Gaitán Delgado (1681), o Esteban Carretero, padre de Santiago Carretero Calvo (1664) y abuelo de Esteban Carretero (1691), y también cuando la diferencia de años lo impide: la madre de Teodora Alonso Delgado (1668) no puede ser Josefa Delgado Martín, nacida en 1663, ni la madre de Pedro Carrascal, casado en 1655, la de Isabel de Sampedro, nacida en 1673. El identificador nuevo indica el hijo, por ejemplo `luis-gaitan-padre-de-domingo-gaitan`.

Se corrigen tres erratas evidentes en nombres nuevos: «Antonio Bambóm», padre de Josefa Bambón de Luelmo, se registra como Antonio Bambón; «Ctalina Hernández», madre de Isabel de Sampedro, como Catalina Hernández, y «deAna Palacios», como Ana Palacios. «Isabel de Luelmo Zamora, S. Frontis)», madre de Juan Pérez de Luelmo, se lee como Isabel de Luelmo, de Zamora (parroquia de San Frontis), por el paréntesis de cierre. Se conservan tal como aparecen «Vadalisa García», madre de Miguel Sánchez García, «Bárbola Blanca» y «Domingo Ortiz». No se crean las madres de las que solo consta el nombre de pila, «Emerenciana (Venialbo)», de Agustín Valladolid San Juan, y «Francisca», de Manuela Blanco, ni la de Catalina Marqués, que la fuente deja en blanco («Juan Marqués y de»).

### Precisión de los eventos

«Falleció» se transcribe como fallecimiento. La única sepultura expresa es la de Atilano Zurdo, que murió en Zamora el 16-03-1732 «y fue enterrado en Gáname al día siguiente», como figura en la nota de su fallecimiento; no ha sido necesario deducir ningún fallecimiento a partir de una sepultura. «Falleció en Moraleja del Vino el», sin fecha, de Manuel Montalvo Martín en la versión de 2019, se registra solo con el lugar, igual que los nacimientos que solo dan la localidad. «Murió ahogada», de María Blanco Pascual, figura en la nota de su fallecimiento.

Los nacimientos sin fecha conservan la lectura de la fuente en la nota: Tomás Montalvo Ramos, Manuel Montalvo Martín y Josefa Rodríguez, nacidos en Moraleja del Vino «antes de 1662, primer libro conservado» y confirmados en 1665; Ana Formariz, Agustín Prieto e Isabel Vicente, de Muga de Sayago, donde no hay libros entre 1641 y 1694, y Juan de Ampudia Ratón, nacido en Valer «entre 1621 y 1663 (Falta ese libro)» y confirmado el 25-10-1670. Las confirmaciones no se registran como bautismos. No hay bautismos expresos, inscripciones ni nacimientos calculados a partir de edades.

Las parroquias se conservan en la nota, sin crear localidades: las cinco de Toro, «Pereruela (Casería de Fontanillas)», la iglesia de S. Juan de Zamora del fallecimiento de Catalina Martín y Nuestra Señora del Viso, en Moraleja del Vino, del matrimonio de Pedro Salvador y María Rodríguez. Tomasa Sariñana nació en «(Santa Catalina)», sin localidad; su marido, Felipe Gil, en «Toro (Santa Catalina)». No se le atribuye Toro y la lectura figura en la nota de su nacimiento. «Fresnadillo de Sayago (La Cernecina)» y «Malillos (La Cernecina)» se registran como nacimientos en Fresnadillo y Malillos, con la lectura en la nota: el lote anterior ya los hacía «vecinos de La Cernecina», que se mantiene como lugar de referencia de Miguel Figal Llamero, Mariana Andrés y Agustín Sastre Lorenzo.

La anotación del encabezado de Domingo Hernández Nogal, «en la partida de bautismo figura Fernández», se refiere a su propio bautismo y figura en la nota de su nacimiento, como se decidió para las anotaciones del lote anterior.

### Lugares del lote

Cuatro localidades nuevas se incorporan al índice, con puntos representativos de IGN/CNIG CartoCiudad y sus URL en `places.json`: Lubián, donde murió Agustín Valladolid San Juan; Villalcampo, donde nació Domingo Barrocal; Valer, del municipio de Gallegos del Río, donde nació Juan de Ampudia Ratón, a unos diez kilómetros de Vegalatrave, donde se casó, y Samir de los Caños, lugar de referencia de Ana Falcón. Salce, verificado en el lote anterior, entra en el índice con el nacimiento de Miguel Esteban. Con las decisiones de la familia que se detallan abajo entran también Chaguazoso y Galende, verificados en lotes anteriores, y Valcamín de Abajo. El índice contiene ochenta y cinco referencias de lugar, ochenta y cuatro de ellas con marcador.

La fuente sitúa a Catalina Hernández, madre de Manuela de la Iglesia Hernández, en «Alcamín de Abajo, Tardobispo». La familia lo identifica como Valcamín de Abajo, un pueblo que ya no existe, y ha pedido situarlo en Tardobispo: su marcador usa el punto representativo de Tardobispo de IGN/CNIG CartoCiudad y no indica la posición exacta del antiguo pueblo, igual que el de La Torre del Salinar. «Mellanes», que solo aparece en una lectura discutida, no se incorpora.

### Decisiones de la familia el 8 de noviembre de 2026

La familia aprobó las propuestas para los pendientes del lote QUINTOS que este documento corrobora y para los homónimos que distingue. Se incorporan con los mismos criterios que el resto del lote: veintinueve fichas nuevas, veintidós enlaces parentales en fichas existentes, los siete matrimonios que esperaban a un cónyuge pendiente y el de Lucas Hernández y Susana Prieto, registrados en las fichas de ambos cónyuges. Los datos que solo daba la versión de 2015 de QUINTOS para esas personas, como las fechas de nacimiento de María Marqués y de Juana Miguel, no se incorporan.

| Pendiente | Decisión y datos incorporados |
| --- | --- |
| Padres de María Marqués | Se adopta la versión de 2018: María Marqués Esteban es hija de Juan Marqués Nieto, nacido en Morales del Vino el 25-01-1656 y fallecido allí el 21-03-1726, hijo de Diego Marqués, y de María Esteban Martín. Juan Marqués Nieto es también el padre de Manuel Marqués Esteban, porque MATERNOS 13–14 dan los mismos datos para sus padres. |
| Madre de Juana Miguel | Se adopta la lectura de 2018 y pasa a llamarse Juana Miguel de Trigo. Queda pendiente cuál es su madre, Inés de Trigo (abajo). |
| Madre de Joaquín Sastre | Joaquín Sastre Bartolo es hijo de Catalina Bartolo, nacida en Malillos, con La Cernecina como lugar de referencia. |
| Madre de Gabriel Martín | Gabriel Martín Villasante es hijo de Antonia Villasante, nacida en Roales. |
| Madre de Esteban Carretero | Esteban Carretero Arias es hijo de María Arias, nacida en Figueruela de Abajo. |
| Padre de Sebastiana Hernández Vega | Domingo Fernández, nacido en Galende. El nombre de Sebastiana se mantiene (abajo). |
| Padres de José Zurdo Herrero | Manuel Zurdo y María Herrero nacieron en Fadón. |
| Manuel Hernández Crespo | Pasa a llamarse Manuel Hernández Crespo Prieto. Nació en Casaseca de las Chanas y es hijo de Lucas Hernández y Susana Prieto, nacidos allí y casados el 28-02-1642. La fecha de su nacimiento queda pendiente (abajo). |
| Juan Rodríguez | Dos hombres. Juan Rodríguez Pérez nació en Casaseca de las Chanas en 1650 y falleció allí el 04-02-1712; se casó con Úrsula Martín Delgado el 22-01-1671 y con Teodora Alonso Delgado el 11-01-1683, y es el padre de Alonso Rodríguez Martín y de Isabel Rodríguez Alonso. Su padre se registra como Juan Rodríguez; su madre, Susana Pérez, queda pendiente (abajo). Juan Rodríguez Corralino nació el 05-11-1651, se casó con Francisca Méndez Madaleno el 15-10-1673 y es el padre de Miguel Rodríguez Méndez; es hijo de Alonso Rodríguez y María Corralino. |
| María de Luelmo | Tres mujeres, con la forma de cada encabezado. María de Luelmo Bueno, hija de Alonso de Luelmo e Inés Bueno, se casó con Alonso de Trigo el 21-04-1666 y es la madre de Inés de Trigo Luelmo. María de Luelmo Martín, hija de Bartolomé de Luelmo e Inés Martín, nació el 28-08-1653, se casó con Francisco Brioso Carrascal el 04-02-1671 y es la madre de Inés y Juan Brioso Luelmo. María Luelmo Martín nació el 28-02-1656, se casó con Juan Cabrero de la Calle el 17-08-1690, falleció el 13-12-1724 y es la madre de Manuel Cabrero Luelmo; es hija de Juan de Luelmo y Felipa Martín, la pareja ya documentada de Francisca de Luelmo Martín. |
| José Pérez | Dos hombres. José Pérez, nacido en Tardobispo, es el padre de Juan Pérez Martín. José Pérez Luelmo nació allí el 20-03-1669, se casó el 18-11-1693 con Manuela de la Iglesia Hernández y es el padre de Juan Pérez de la Iglesia; su madre es Ana de Luelmo, y su padre, otro José Pérez, queda pendiente (abajo). |
| Alonso Esteban | Dos hombres. Alonso Esteban Hernández, nacido en Villamor de la Ladre el 11-11-1663 e hijo de Domingo Esteban y Josefa Hernández, es el padre de Josefa Esteban Simón. La ficha existente de Alonso Esteban no cambia. |
| Francisco Martín y María Rodríguez | Dos parejas. Francisco Martín y María Rodríguez, nacidos en Chaguazoso, son los padres de Francisco Martín Rodríguez. Francisco Martín Cordero, nacido en Morales del Vino el 05-08-1654 e hijo de Luisa Cordero, es el padre de Jerónima Martín Rodríguez; su madre, María Rodríguez, queda pendiente (abajo). |
| «Alcamín de Abajo, Tardobispo» | Valcamín de Abajo, lugar de referencia de Catalina Hernández, con el marcador en Tardobispo, como se explica en los lugares del lote. |

### Pendientes de este lote

Por decisión de la familia, los casos siguientes se mantienen como están hasta revisar las fotografías de las partidas. Ninguno modifica valores existentes ni se ha trasladado a `observations`.

#### Dato de contexto para un pendiente del lote QUINTOS

| Pendiente | Lectura de este documento | Estado |
| --- | --- | --- |
| Fallecimiento de Alonso Piorno Zurdo («Falleció en Tamame y fue enterrado en Gáname el 12-05-1705»; su hijo nació en 1708) | PATERNOS 129: su padre, Antonio Piorno, «Falleció en Gáname el 11-05-1704». | El fallecimiento de Antonio se incorpora; el de Alonso sigue pendiente. |

#### Homónimos del lote QUINTOS sin resolver

| Nombre | Lectura de este documento | Estado |
| --- | --- | --- |
| Juan Marqués, padre de Catalina Marqués Portales | MATERNOS 23: «Juan Marqués», nacido en Morales del Vino, marido de Luisa Portales, que murió el 28-05-1741. Juan Marqués Nieto, marido de María Esteban, ya tiene ficha: nació en 1656 y murió en 1726. | Puede ser el mismo hombre casado dos veces. Sin enlace paterno para Catalina. |
| Ana Melado, de Salce | MATERNOS 148: «Ana Melado», nacida en Salce. | Sin datos nuevos. |

#### Fechas y datos contradictorios

| Persona o pareja | Valor existente | Lectura de la fuente | Estado |
| --- | --- | --- | --- |
| Catalina Nieto Galán, PATERNOS 102 | Nacimiento el 26-10-1664 | «Nació en Casaseca de las Chanas el 26-10-1661»; «Era hija de Juan Nieto (Mellanes) y María Galán (Casaseca de las Chanas)». PATERNOS 51 dice de Juan Nieto «Nació en Casaseca de las Chanas». | Se mantiene la fecha existente y no se añade Mellanes. Sus padres se casaron el 11-09-1660. |
| Luis Gaitán Delgado e Isabel Rodríguez Alonso, PATERNOS 103–104 | Matrimonio el 06-11-1703 | «Se casó en Casaseca de las Chanas el 06-11-1701» | Se mantiene 1703. Su hija Teresa nació el 28-09-1704. |
| Francisco Zamora García, MATERNOS 19 | Nombre «Francisco Zamora García»; fallecimiento el 02-12-1723 | 2019: «Francisco de Zamora Díez», «Falleció en Moraleja del Vino el 03-12-1723»; 2018: «Francisco de Zamora», sin fallecimiento. PATERNOS 29–30 nombran a sus padres, Francisco Zamora e Inés García. | Sin cambios. |
| Juan Portales y Ana Mª Prieto, PATERNOS 119–120 | Sin matrimonio | «Se casó en Morales del Vino el 21-01-1722.», la fecha y el lugar del matrimonio de su hija Manuela Portales Prieto, nacida en 1698. | Matrimonio sin incorporar; sus nacimientos sí se incorporan. |
| Juan Vega, padre de Juan Vega Rodrigo, PATERNOS 145 | «Juan Vega», sin datos | Encabezado «Juan Vega Salvador»; «Nació en Gáname el 07-01-1691»; «Falleció en Gáname el 02-12-1706»; «Era hijo de Marcos Vega y de Isabel Salvador». Son el nombre, el nacimiento y los padres de Juan Vega Salvador, otra ficha, casado en 1716, mientras que Juan Vega Rodrigo se casó en 1712. | Sin incorporar. |
| Marcos Vega, PATERNOS 135, 149 y 249 | «Marcos Vega», sin datos | PATERNOS 149: «Marcos Vega Salvador», «Nació en Gáname el 15-03-1696», «Era hijo de Santiago Vega y de Josefa Salvador». Sus hijos José, Juan y María nacieron en 1689, 1691 y 1698. | Se incorporan el nacimiento en Gáname y el fallecimiento del 07-01-1715 de PATERNOS 135; el nombre, la fecha de nacimiento y los padres quedan pendientes. |
| Juan Martín Esteban y Lorenza Cabrero, PATERNOS 45–46 | Sin matrimonio | «Se casó en Morales del Vino el 31-06-1684» | La fecha no existe: se registra el matrimonio en Morales del Vino, sin fecha. |
| Pedro Carrascal, PATERNOS 61 | Sin fallecimiento | «Se casó en Morales del Vino el 22-11-1655»; «Falleció en Morales del Vino el 29-10-1732» | Habría muerto setenta y siete años después de su boda. Fallecimiento sin incorporar; el matrimonio sí. |
| María Hernández, madre de Luisa y Manuel Roncero Hernández, MATERNOS 68, 74 y 218 | Lugar de referencia El Perdigón | 68 y 74: «Nació en El Perdigón»; 218: «Nació en Tardobispo». | Nacimiento sin incorporar; se mantiene el lugar de referencia. Su fallecimiento en Tardobispo el 02-06-1737 sí se incorpora. |
| Antonio Jambrina, PATERNOS 107 | Lugar de referencia Moraleja del Vino | «Nació en Moraleja del Vino o Casaseca de las Chanas» | Nacimiento sin incorporar. |
| Manuel Hernández Crespo Prieto, PATERNOS 101 | Nacimiento en Casaseca de las Chanas, sin fecha | `TATARABUELOS QUINTOS.docx`, ambas versiones: «Nació en Casaseca de las Chanas el 20-12-1655»; este documento: «Nació en Casaseca de las Chanas el 22-12-1655». | Fecha sin incorporar. |
| Ana de Cifuentes, madre de María Bragado, PATERNOS 40 | María Bragado no tiene madre enlazada | «Ana de Cifuentes», «Nació en Villaralbo»; PATERNOS 39 está en blanco. Ana de Cifuentes es también la madre de Francisco de Prada Cifuentes (PATERNOS 42), nacida en Rábano de Sanabria. | Sin incorporar: puede repetir por error el nombre de PATERNOS 42. |

#### Diferencias de nombre

| Ficha | Valor actual | Lectura de la fuente | Estado |
| --- | --- | --- | --- |
| `josefa-rodriguez` | Josefa Rodríguez | MATERNOS 32, 2018: «Josefa Rodríguez Urueña», «hija de Domingo Rodríguez y de Catalina Urueña». 2019: «Josefa Rodríguez Martín», «hija de José Rodríguez y de Engracia Martín.» | Se incorporan su nacimiento, su matrimonio con Manuel Montalvo Martín y su fallecimiento; el segundo apellido y los padres quedan pendientes. |
| `anton-martin` | Antón Martín | MATERNOS 141: «Antón Martín» en 2018, «Antonio Martín» en 2019. | Se mantiene el nombre y se incorpora el nacimiento en Villadepera. |
| `maria-bartolo` | María Bartolo | MATERNOS 142: «María Bartolo» en 2018, «María Bártulo» en 2019. Su hijo es Santiago Martín Bartolo. | Se mantiene el nombre y se incorporan el nacimiento y el fallecimiento de 2019. |
| `isabel-de-sampedro` | Isabel de Sampedro | MATERNOS 34: «Isabel de San Pedro Hernández», «hija de Alonso de San Pedro y de Ctalina Hernández». | Se mantiene el nombre; se incorporan sus eventos y sus padres, con la grafía de la fuente. |
| `teresa-arroyo` | Teresa Arroyo | MATERNOS 48: «Teresa de Arroyo Madrid», «hija de Diego de Arroyo y de María Madrid». | Igual que el caso anterior. |
| `ines-ortijo` | Inés Ortijo | PATERNOS 198: «Inés Ortizo Blanco», «hija de Domingo Ortiz y de Ana Blanco». Su hijo es Domingo Garrote Ortijo; el archivo ya escribe «Ortizo» en Mariana Ortizo Benito y Martín Ortizo Luengo. | Igual que el caso anterior. |
| `bernardo-gaspar` | Bernardo Gaspar | PATERNOS 231: el encabezado solo dice «de Olmedo»; «Nació en Gáname el 14-02-1688»; «Era hijo de Alonso Gaspar y de Josefa de Olmedo». | Se incorporan el nacimiento y los padres; el nombre podría completarse como Bernardo Gaspar de Olmedo. |
| `francisca-lozano` | Francisca Lozano | PATERNOS 72: «Francisca Lozano o Corralino». El lote anterior resolvió «¿Lozano o Coralin?» a favor de Lozano. | Se mantiene el nombre y se incorpora el nacimiento. |
| `ines-rodrigo` | Inés Rodrigo | PATERNOS 220: «Inés Rodrigo o Rodríguez». | Igual que el caso anterior. |
| `sebastiana-hernandez` | Sebastiana Hernández Vega | `TATARABUELOS QUINTOS.docx`, 2018: «Sebastiana Fernández Vega (Aparece a veces el apellido Hernández)»; 2015: «Sebastiana Hernández Vega». Su padre es ahora Domingo Fernández. | Se mantiene el nombre. |

#### Homónimos de la misma localidad

Los padres siguientes no se crean ni se enlazan mientras no se confirme si son una o varias personas; el otro progenitor de esas entradas sí se incorpora.

| Nombre | Menciones | Estado |
| --- | --- | --- |
| Juan Martín, de Morales del Vino | PATERNOS 43 y MATERNOS 43: marido de Luisa Cordero y padre de Pedro Martín Cordero, nacido en 1653, y de Francisco Martín Cordero, nacido en 1654. PATERNOS 45: la ficha existente, ahora Juan Martín Esteban, marido de Lorenza Cabrero en 1684 y padre de Francisco Martín Cabrero. | Sin enlace paterno para Pedro y Francisco Martín Cordero. |
| Juan de Luelmo, de Morales del Vino | MATERNOS 47: marido de María Pinto y padre de Jerónimo de Luelmo Pinto, casado en 1714. La ficha existente es marido de Felipa Martín y padre de Francisca de Luelmo Martín, nacida en 1654. | Sin enlace paterno para Jerónimo. |
| María Rubio, de Casaseca de las Chanas | PATERNOS 66: mujer de Pedro Madaleno y madre de María Madaleno Rubio, nacida en 1637. PATERNOS 99: mujer de Juan Díez y madre de Pedro Díez Rubio, nacido en 1652. | Sin enlaces maternos. |
| Catalina Luengo, de Abelón | PATERNOS 210: mujer de Martín Andrés y madre de Inés Andrés Luengo, nacida en 1659. MATERNOS 151: mujer de Juan Ortizo y madre de Martín Ortizo Luengo, nacido en 1670. | Sin enlaces maternos. |
| Susana Pérez, de Casaseca de las Chanas | PATERNOS 55 y 105: mujer de Juan Rodríguez y madre de Juan Rodríguez Pérez, nacido en 1650. La ficha existente de Susana Pérez se casó con Luis Alonso en 1653. | Sin enlace materno para Juan Rodríguez Pérez. |
| Luisa Nieto, de Morales del Vino | MATERNOS 3 y 13: mujer de Diego Marqués y madre de Juan Marqués Nieto, nacido el 25-01-1656. PATERNOS 44: la ficha existente, mujer de Juan Nieto y madre de María Nieto Nieto, nacida el 28-04-1657. | Sin enlace materno para Juan Marqués Nieto. |
| José Pérez, de Tardobispo | MATERNOS 221: marido de Ana de Luelmo y padre de José Pérez Luelmo, nacido en 1669. MATERNOS 65: la ficha de José Pérez, padre de Juan Pérez Martín, nacido en 1678. | Sin enlace paterno para José Pérez Luelmo. |
| Inés de Trigo, de Morales del Vino | MATERNOS 36: mujer de Juan Miguel y madre de Juana Miguel de Trigo, casada en 1720. La ficha existente de Inés de Trigo Luelmo nació en 1671, se casó en 1695 con Manuel de Carrascal Bragado y tuvo hijos con él en 1701 y 1705; para ser su madre, Juana habría nacido antes de 1695. | Sin enlace materno para Juana Miguel de Trigo. |
| María Rodríguez, de Pereruela | MATERNOS 44 y 64: mujer de Francisco Martín Cordero y madre de Jerónima Martín Rodríguez, cuyos hijos nacieron en 1744 y 1746. La ficha existente de María Rodríguez Hernández nació en Pereruela en 1680 y se casó con Tomás Ocampo. | Sin enlace materno para Jerónima. |
| Juan Hernández o Fernández | MATERNOS 223: «Juan Hernández o Fernández», marido de Ana María Nogal y padre de Domingo Hernández Nogal, nacido en Pereruela en 1676. MATERNOS 224: «Juan Hernández (o Fernández)», marido de Isabel Fernández y padre de Micaela Hernández Fernández, nacida en Tardobispo en 1688. | La propia fuente duda del apellido. Sin enlaces paternos. |

### Verificación del lote

Al cerrar el lote, `node familia/build-data.mjs` dio 955 personas, 217 apellidos y 82 referencias de lugar. Tras las decisiones de la familia, y con la persona que añade el lote de fotografías de ABUELOS, el archivo tiene 985 personas, 221 apellidos y 85 referencias de lugar. Las 26 pruebas de `node --test familia/tree-layout.test.mjs` pasaron. Un cotejo independiente con el texto de 2019 comprobó que cada fecha y cada lugar añadidos figuran en la entrada correspondiente y que los nombres nuevos figuran en las líneas de padres, salvo las erratas corregidas. También comprobó que no se ha alterado ningún valor existente, salvo para ampliar nombres y retirar lugares de referencia que coinciden con el nacimiento, y que no hay observaciones nuevas. Una revisión de coherencia de fechas, que busca bautismos anteriores al nacimiento, padres demasiado jóvenes o mayores, nacimientos posteriores a la muerte de un progenitor, bodas antes de los trece años y vidas demasiado largas, solo encontró el fallecimiento de Pedro Carrascal, que queda pendiente. Los datos de las decisiones de la familia se cotejaron del mismo modo con las entradas de este documento y con las de la versión de 2018 de `TATARABUELOS QUINTOS.docx`: no alteran valores existentes ni añaden contradicciones de fechas.

Se revisaron en el navegador varias fichas, la pestaña de lugares, el mapa y la vista móvil, sin errores de consola. Solo se modificaron los registros, las coordenadas, este README y los datos generados; el código y el diseño de la web se mantienen.

## Lote de fotografías de ABUELOS

Se han inspeccionado las nueve imágenes originales de «Árbol genealógico/Abuelos», con recortes a resolución nativa, y se ha transcrito cada partida antes de compararla con el árbol. Son siete partidas: cinco bautismos y dos matrimonios. Las dos fotografías de Bernardo de 1878 y las dos de Ángela de 1881 documentan una sola partida por pareja; no cuentan como testimonios independientes. El registro [sources/abuelos.json](sources/abuelos.json) conserva los nombres y SHA-256 de los archivos, las transcripciones literales, los hechos extraídos, los enlaces de persona y evento, las dudas de lectura y las decisiones. Los originales siguen fuera del repositorio.

También se han cotejado las dos versiones de `ABUELOS.docx`: la de 2015 de esta carpeta y la de 2017 de «Árbol genealógico2». Se conservan como versiones de una sola fuente. La de 2017 añade los fallecimientos de Bernardo y Ángela y la iglesia de San Torcuato para Ángela, datos ya incorporados. Ninguna fotografía de este lote documenta una muerte, funeral, sepultura o inscripción civil; esos datos no se modifican.

### Personas y eventos

| Partida | Identificación y aplicación |
| --- | --- |
| Miguel Calvo, 1872 | Coinciden sus padres Nicanor y Marcelina, sus cuatro abuelos y las fechas del nacimiento y bautismo. Se enlaza la transcripción a ambos eventos, se incorpora Casaseca de las Chanas al bautismo y San Juan Bautista a su nota. El nacimiento fue hacia las once de la noche. |
| Lucía Piorno, 1880 | Coinciden Salvador y Vicenta, los cuatro abuelos y las fechas. Se enlaza la transcripción al nacimiento y bautismo y se incorpora Casaseca de las Chanas al bautismo. El nacimiento fue a las diez y media de la mañana del día anterior, 23-03-1880. |
| Miguel y Lucía, 1898 | Coinciden cónyuges, padres, localidad y matrimonio del 09-11-1898. La transcripción figura en el matrimonio de ambos; la nota conserva San Juan Bautista, las amonestaciones del 30-10, 01-11 y 06-11 y las bendiciones recibidas en la ceremonia. |
| Bernardo Brioso Pérez, 1878 | Coinciden Enrique y Balbina, los cuatro abuelos y el nacimiento del 01-06-1878. Se enlaza la partida al nacimiento y bautismo. La fecha de bautismo se corrige con autorización familiar, como se recoge abajo. |
| Ángela de las Heras Prada, 1881 | Coinciden Benito y María Antonia, los cuatro abuelos y las fechas del 23 y 25 de agosto. La transcripción se enlaza a ambos eventos. Se conserva «Prada» en el margen y «Pradas» en el cuerpo, sin modificar los nombres del árbol. |
| Bernardo y Ángela, 1903 | Coinciden los cónyuges, sus cuatro padres, Tardobispo y el año 1903. La fotografía empieza en la continuación y no contiene el día ni el mes de la boda: el 20-06-1903 sigue procediendo de `ABUELOS.docx`. Las amonestaciones del 07, 11 y 14 de junio se distinguen del matrimonio. |
| Bernardo Brioso, 1861 | `Bernardo Brioso Pérez (2).JPG` documenta a otro Bernardo: nació el 12-03-1861 y fue bautizado el 15-03-1861. Sus padres Florencio Brioso Alonso y Antonia de Mena Santamaría coinciden con los cuatro abuelos citados: Baltasar Brioso, Luisa Alonso, Tomás Mena y Valeria Santamaría. Se crea `bernardo-brioso-1861`, hermano de Enrique y tío de Bernardo Brioso Pérez. Se conserva el nombre legible Bernardo Brioso, sin añadir un segundo apellido, y no se atribuye lugar a su nacimiento o bautismo: la partida identifica al cura de Tardobispo y sus anejos, pero no expresa el lugar de esos eventos. |

Las cuatro fichas existentes añaden «Fotografías de partidas» a su atribución; mantienen sus identificadores, nombres y enlaces. Este lote añade una persona al árbol. No se crean personas a partir de nombres aislados de padrinos o testigos.

### Decisiones de la familia

| Dato | Valor existente y lectura literal | Decisión |
| --- | --- | --- |
| Bautismo de Bernardo Brioso Pérez | `02-06-1918`, de ambas versiones de `ABUELOS.docx`; la partida dice «En el dia dos de Junio del año mil ochocientos setenta y ocho». | La familia autorizó registrar `02-06-1878` y retirar la observación de comprobación pendiente. |
| Edad de Miguel en el matrimonio | Nacimiento 11-02-1872 y matrimonio 09-11-1898: 26 años cumplidos. La partida dice «veintitres años de edad». | El 8 de noviembre de 2026, la familia confirmó mantener el nacimiento documentado y conservar la edad solo en la transcripción. |
| Edad de Bernardo en el matrimonio | Nacimiento 01-06-1878 y matrimonio 20-06-1903: 25 años cumplidos. La continuación dice «veinti cuatro años de edad». | Misma decisión: no se cambia el nacimiento ni se añade una observación. |
| Edad de Ángela en el matrimonio | Nacimiento 23-08-1881 y matrimonio 20-06-1903: 21 años cumplidos. La continuación dice «veinti tres años de edad». | Misma decisión: no se cambia el nacimiento ni se añade una observación. |

No se calcula ninguna fecha de nacimiento a partir de esas edades. Las dudas de lectura permanecen separadas de las transcripciones: entre ellas, la localidad del abuelo Julián, la de Francisco de las Heras, algunos apellidos de testigos, firmas y palabras cortadas de los márgenes. Se conserva `[ilegible]` donde no hay lectura segura; no se completa con los valores del árbol. La frase tachada y la inserción entre líneas del matrimonio de 1903 conservan sus palabras legibles, con su disposición explicada fuera de la transcripción. El comienzo de esa partida queda sin cotejar: la fotografía no permite verificar el día y mes del matrimonio.

### Verificación del lote

Se reconstruyeron los datos y pasaron las 26 pruebas de `node --test familia/tree-layout.test.mjs`. La comprobación independiente cotejó los nueve SHA-256 con los originales, las siete partidas y todos los enlaces de transcripción a persona y evento. Este lote modifica cuatro personas existentes y añade una; conserva sus nacimientos documentados, los fallecimientos y los enlaces parentales anteriores, con la única corrección de fecha y retirada de observación autorizadas para el bautismo de Bernardo. Se ajustó la prueba existente de conservación del matrimonio para comparar todos sus detalles con `records.json`, incluidas las nuevas transcripciones y notas.

Se comprobaron las cinco personas en el navegador, en escritorio y móvil: los catorce controles de transcripción, las fechas separadas de nacimiento y bautismo, la navegación entre padres y cónyuges y la descendencia de Florencio y Antonia. No hubo desbordamiento horizontal, errores ni advertencias de consola. El código y el diseño de la web no se modifican. La reconstrucción final incluye también los datos de otros lotes incorporados simultáneamente: 985 personas, 221 apellidos y 84 referencias de lugar.

## Cotejo de las dos versiones de BISABUELOS

El 8 de noviembre de 2026 se compararon los dos archivos `BISABUELOS.docx`: la revisión 14 de «Árbol genealógico/Bisabuelos», modificada internamente el 18 de julio de 2015, y la revisión 15 de «Árbol genealógico2», modificada el 22 de agosto de 2018. Son dos versiones de una sola fuente. Sus SHA-256, los párrafos literales, los hechos extraídos y los enlaces a las personas existentes se conservan en [`sources/bisabuelos.json`](sources/bisabuelos.json). No se abrieron las fotografías de esta carpeta.

Las ocho personas principales, sus dieciséis progenitores, los ocho nacimientos, los ocho bautismos, las tres parejas con matrimonio fechado y los cuatro fallecimientos ya estaban incorporados. La identificación se cotejó mediante ambos progenitores, fechas, localidades y parejas o hijos documentados. No se añaden personas; la única corrección de una ficha es el bautismo de Enrique y la retirada de su observación de discrepancia, por la confirmación familiar detallada abajo. Se mantienen los identificadores, las atribuciones y los nombres ampliados por fuentes posteriores, como Josefa Ygenia Rabanal Ibáñez y Ángel Celedonio Prada Girón.

La versión de 2018 solo añade cuatro causas de fallecimiento; todas figuraban ya en `death.note`:

| Persona | Lectura de 2018 |
| --- | --- |
| Nicanor Calvo Martín | «a consecuencia de taber dorsal» |
| Balbina Pérez Sánchez | «a consecuencia de insuficiencia valvular central» |
| Benito José de las Heras Rabanal | «a consecuencia de hemorragia cerebral» |
| Mª. Antonia Prada Carretero | «a consecuencia de colapso cardíaco» |

Las cuatro líneas dicen «Falleció» y se cotejan como fallecimientos. Ninguna versión aporta fechas independientes de funeral, entierro o inscripción. No se deduce una fecha a partir de otra ni se calcula ningún nacimiento a partir de una edad. Los bautismos de Nicanor, Marcelina, Salvador y Vicenta siguen sin lugar, porque el texto no lo expresa. Las líneas incompletas no aportan eventos y la frase repetida del matrimonio de Benito corresponde a una sola boda. Las precisiones y decisiones familiares de lotes posteriores se conservan.

### Corrección confirmada por la familia

El valor anterior del bautismo de Enrique era el **29-01-1885**, frente al nacimiento del **28-01-1855**. Ambas versiones dicen: «Nació en Tardobispo el 28-01-1855. Fue bautizado en Tardobispo el 29-01-1885.» Tras presentar ambos valores y el extracto, la familia confirmó el 8 de noviembre de 2026: «Baptism should be 29-01-1855, day after birth». Se registra el bautismo el **29-01-1855** y se retira únicamente la observación de discrepancia resuelta; se mantiene la observación sobre la ampliación de su apellido a «de Mena». Los párrafos y los hechos literales de `sources/bisabuelos.json` conservan **1885**, junto con la decisión familiar separada. La corrección procede de esa confirmación, sin haber abierto la fotografía.

No quedan decisiones pendientes de este cotejo documental. Las fotografías de las partidas siguen fuera del alcance del lote y se revisarán más adelante.

### Verificación del cotejo

Se reconstruyeron los datos con `node familia/build-data.mjs`: 985 personas, 221 apellidos y 85 referencias de lugar. Pasaron las 26 pruebas de `node --test familia/tree-layout.test.mjs`. Se cotejaron las ocho fichas generadas y los dieciséis enlaces parentales con `records.json`; la comparación con el estado anterior confirmó que solo cambiaron la fecha del bautismo de Enrique y la retirada de la observación resuelta. La ficha generada de Enrique recoge el **29-01-1855**. El código, las pruebas y el diseño de la web se mantienen.

## Política de presentación sin referencias a archivos

El 8 de noviembre de 2026 la familia pidió retirar de la web y los datos de personas las atribuciones y las referencias a archivos, documentos, fotografías y versiones. Confirmó conservar los detalles internos de auditoría en este README y en `sources/`. Las 982 atribuciones anteriores y los 88 cambios de texto se conservan en `sources/display-cleanup.json`.

Se retiraron los campos `source` de las personas y del catálogo, su visualización en las fichas y los estilos que ya no se usan. El proceso de construcción rechaza nuevas atribuciones de ese tipo. Las notas expresan directamente horarios, parroquias, incertidumbre, límites de fechas y confirmaciones. Se conservan las diferencias de apellidos y los homónimos; las cuatro referencias a partidas quedan en `observations`, con el tipo de partida correspondiente. Los nombres, fechas, lugares, relaciones y transcripciones literales de las 985 personas no cambian. Los datos geográficos de procedencia y la atribución de OpenStreetMap se mantienen.

La reconstrucción conserva 985 personas, 221 apellidos y 85 lugares. Pasaron las 27 pruebas, incluida la nueva comprobación de ausencia de atribuciones y referencias a archivos en los datos canónicos y generados. La auditoría independiente reconstruyó el estado anterior a partir del registro interno y comprobó las 985 fichas generadas. La revisión del navegador en escritorio y móvil confirmó la ausencia de atribuciones y referencias prohibidas, la conservación de las observaciones permitidas y la ausencia de desbordamiento horizontal, errores y advertencias de consola. El diseño se conserva; el crédito del pie pasa a «Investigación familiar: Bernardo Calvo Brioso».

## Lote de fotografías de la rama materna

El 8 de noviembre de 2026 se incorporan las seis fotografías de «antepasados por via materna», junto con los datos de los abuelos facilitados por la familia. Se añaden 72 personas y se enlaza a María Ángeles Devesa Herrero con sus padres, Antonio Devesa Blanco y Josefa Herrero Fernández. El archivo pasa a 1057 personas, 235 apellidos y 87 lugares. Arturo sigue siendo el único punto de partida; las dos ramas se recorren desde sus padres.

La lectura visual, los nombres de las imágenes y sus huellas SHA-256, las decisiones de importación y los pendientes se conservan en `sources/materna.json`. Las fotografías originales y los recortes de lectura permanecen fuera del repositorio. Las fichas públicas no incluyen atribuciones a archivos.

### Datos y lugares confirmados por la familia

- Antonio Devesa Blanco nació en Villardeciervos el **27-03-1922**, se casó en Villardeciervos y falleció en Zamora el **14-04-2010**. Se conserva su fecha de nacimiento expresa frente a la lectura distinta de la fotografía general.
- Josefa Herrero Fernández nació en Villardeciervos el **17-11-1920**, se casó en Villardeciervos y falleció allí en **1987**. La familia confirmó la fecha de las fotografías y retiró el año inicial de 1924.
- Teresa Cuesta Unzueta nació el **26-05-1858**, fecha confirmada por la familia tras la duda de lectura del último dígito del año.
- Por indicación familiar, se asumen Villardeciervos como lugar de nacimiento, matrimonio y fallecimiento de los antepasados de estas fotografías, salvo las excepciones expresas. No se inventan fechas desconocidas. Los matrimonios con lugar se registran para las parejas de progenitores identificadas; no se crean cónyuges sin nombre para los antepasados del límite del árbol.
- La familia confirmó que los otros lugares indicados se interpretan como **nacimientos**, manteniendo Villardeciervos como lugar supuesto de matrimonio y fallecimiento. Cional se aplica a Domingo de la Cuesta, María Ferreras y Lorenzo Cuesta Herrero; Valdemerilla, a Juan y Pedro Palmero. No se extiende Valdemerilla a Francisca Gallego.

Cional pertenece al municipio de Villardeciervos y Valdemerilla al de Cernadilla, ambos en Zamora, según la [Junta de Castilla y León](https://transparencia.jcyl.es/concentracionparcelaria/zamora/villardeciervos/etp/Vciervo_ETP_MEM_1_Memoria.pdf) y la [Diputación de Zamora](https://www.diputaciondezamora.es/opencms/provincia/nuestros-ayuntamientos/detalle-municipio/Cernadilla/). Sus coordenadas se obtuvieron de CartoCiudad (IGN), comprobando que los resultados eran localidades de esos municipios; se conservan las consultas exactas en `places.json`.

### Lecturas y pendientes

Las fechas únicas junto a los nombres se interpretan como nacimientos por su disposición y coherencia generacional. Las imágenes no las rotulan como bautismos, bodas ni fallecimientos. Las líneas de pareja y descendencia se interpretan como padre y madre, aplicando la convención familiar de matrimonio de los progenitores.

Antonio Devesa Junquera y Petra Blanco Palmero conservan las fechas más nítidas del árbol enfocado: **07-05-1887** y **13-02-1887**. Para Desiderio Devesa Romero se registra únicamente **abril de 1844**, común a las lecturas del 13 y del 19. Josefa Junquera Martínez queda sin fecha de nacimiento por la diferencia entre **20-12-1833** y **20-12-1853**; no se corrige el año a partir de la edad de su padre. Se omite la fecha tachada bajo Pedro Herrero Romero.

Se conserva el nombre legible María Román sin completar su segundo apellido dudoso, Corado o Canedo. Las grafías Botillo de María Ramos y Josefa Martínez se conservan según el árbol enfocado, mientras que Felipa figura como Bobillo; no se corrigen los apellidos para hacerlos coincidir entre madres e hijos. Se usa Manuela Ferreras Santiago según el árbol enfocado y se registra internamente la variante María del árbol general. Se conservan Francisco Junquera y María Baladrón según la imagen más nítida; las lecturas iniciales Timoteo y Beltrán de la imagen general no crean personas adicionales. Unzueta reúne la grafía reducida Unzeta de Manuel; Baldón en Francisco Fernández se mantiene separado del Baladrón de María.

Tirso Romero y Tirso Romero Santiago se reúnen porque coinciden su esposa, María Romero Rodríguez, y sus líneas familiares. El 11 de noviembre de 2026 la familia confirmó que María y Antonio Unzueta Fernández son hermanos, hijos de Francisco Unzueta Junquera y María Fernández Villar; las fichas parciales de los padres de María se reunieron con las fichas completas. Se mantienen pendientes, con fichas separadas, las posibles identidades de Juan Martínez y Felipa Bobillo con Juan Martínez Santiago y su esposa homónima, y de las dos Dominga Romero Romero, que aparecen con cónyuges distintos. La Francisca Gallego de Valdemerilla se mantiene separada de la homónima ya existente en la rama paterna. Estas posibilidades no se convierten en enlaces ni en observaciones públicas.

### Verificación del lote materno

La reconstrucción genera 1057 fichas, 235 apellidos y 87 lugares. Pasan las 27 pruebas existentes, actualizando las tres expectativas de disposición que ahora incluyen a los abuelos y bisabuelos maternos. La auditoría confirma que las 72 personas nuevas son alcanzables desde María Ángeles, que las fichas generadas coinciden con sus datos canónicos y que las otras 984 fichas anteriores conservan sus datos. El cotejo independiente de las seis imágenes no detecta errores ni omisiones en las relaciones incorporadas. La revisión en el navegador confirma las fechas y lugares de Antonio y Josefa, sus padres, su matrimonio y el enlace a María Ángeles.

## Revisión parcial de fotografías de tatarabuelos séptimos

Se ha iniciado el cotejo de la carpeta «Tatarabuelos séptimos», que contiene 61 imágenes. La revisión está incompleta: no se deben considerar definitivas ni incorporadas todas las partidas. El registro interno [`sources/septimos-fotografias.json`](sources/septimos-fotografias.json) identifica el original utilizado, su huella, la transcripción, los enlaces y las dudas de lectura.

La partida de matrimonio de Domingo Turiel e Inés Gago se ha asociado a los padres de María Turiel Gago por la coincidencia de ambos nombres, la localidad y la cronología. Se incorpora el matrimonio del **8 de febrero de 1669** a ambas fichas. La partida identifica a Inés como viuda de Andrés, pero su apellido no se lee con seguridad. La localidad de la ceremonia no se registra: el párroco identifica su parroquia y a los contrayentes como vecinos, pero el lugar preciso de la celebración no queda inequívoco. Las demás identificaciones y lecturas requieren revisión; no se modifican por semejanza de nombres o por el nombre del archivo.

También se incorpora la partida de matrimonio de Diego de Arroyo y María Madrid del **15 de noviembre de 1690**, vinculada a la pareja ya registrada como progenitora de Teresa Arroyo. La partida identifica sus lugares de naturaleza; no se convierten en fechas o lugares de nacimiento. La partida de Catalina Garrote documenta su fallecimiento el **16 de junio de 1711**, su sepultura en la iglesia de San Martín de Abelón sin fecha de entierro expresa y a sus herederos José, Juana y Teresa Benito. La combinación de los nombres de los herederos, la localidad y el asiento previo de Francisco Benito permite distinguirla de la homónima de Gáname.

La partida de Isabel Crespo documenta su fallecimiento el **22 de febrero de 1723**, su sepultura en San Martín de Abelón sin fecha de entierro expresa y sus hijos Manuel, Agustín, María e Isabel Sesma. María ya estaba en el árbol; se añaden las otras tres personas como hijas de Isabel. La partida no atribuye expresamente su paternidad a Alonso Sesma, por lo que no se completa esa relación automáticamente.

La familia confirmó que Juan Ortijo y Catalina Luengo de las partidas de 1707 son los padres de Martín Ortizo Luengo. Se conserva el nombre previo de Juan Ortizo, se añade Catalina como madre de Martín y se registran los fallecimientos expresos del **17 de junio** y el **6 de junio de 1707**, respectivamente. Ambos asientos describen sus sepulturas sin dar fechas separadas. El registro interno conserva la decisión, las grafías y las huellas de las fotografías. Juan nombra cuatro hijos como herederos, sin identificarlos a todos en el asiento.

Las identificaciones de los bautizados Lorenzo y Luis Valladolid siguen pendientes: la familia indicó que no sabe si son las personas existentes. El apellido del padre de Lorenzo podría leerse Hernández o Fernández; no se ha fijado una lectura segura. La revisión de las demás imágenes y la transcripción definitiva de sus partidas siguen pendientes; el inventario interno conserva las huellas y distingue los asientos incorporados. Se han reconstruido 1064 fichas sin cambiar el diseño de la página.

La familia confirmó que Juan de Luelmo y María Pinto, casados el **2 de febrero de 1664**, son los padres de Jerónimo de Luelmo Pinto, y que ese Juan es distinto del padre de María Luelmo Martín. La partida nombra a los padres de Juan, Bartolomé de Luelmo e Inés Martín, ya registrados, y a los de María, Juan Pinto y Catalina de la Calle. La familia confirmó que esta Catalina es distinta de la madre homónima de Juan Cabrero de la Calle. Se incorporan Juan de Luelmo, Juan Pinto y la segunda Catalina, y se conservan separadas las fichas homónimas. La anotación inferior lleva otra fecha, **29 de septiembre de 1664**, pero la lectura de su verbo no es suficientemente segura para clasificarla como otra celebración ni cambiar la fecha del matrimonio.

La familia confirmó también la identidad de Alonso Sesma en el asiento de sepultura de San Martín de Abelón. El **25 de noviembre de 1726** es la fecha de entierro, no una fecha de fallecimiento. Por ello se añade `burial` al esquema y se presenta como «Entierro» con el mismo diseño de los demás eventos; no se crea una fecha de fallecimiento ni se calcula una edad a partir del entierro. Las palabras que podrían relacionar a las personas nombradas al final de la partida siguen borrosas y no se usan para completar filiaciones.

Las partidas de Catalina Jurado y Ana de Luelmo nombran a ambos progenitores que figuran para María Jurado Delgado y para Juan y María de Luelmo Martín, respectivamente. Se añaden a las observaciones las hermanas documentadas y sus bautismos; no se fusionan con las otras Catalina y Ana ya registradas, porque la familia no pudo confirmar esas identidades. Los borradores de Magdalena Vaquero y Juan Carbajal también permanecen separados para su conciliación. Las transcripciones nuevas se escriben en párrafos, sin reproducir los saltos de línea originales dentro de una oración.

Se han inspeccionado las 61 imágenes originales y el inventario registra sus huellas. Doce imágenes corresponden a nueve asientos incorporados; para otras 48 imágenes hay lecturas internas provisionales de 49 asientos sin enlazar a eventos, incluidas partidas con huecos importantes. Una imagen permanece en revisión inicial. Los borradores no sustituyen una transcripción definitiva ni prueban la identidad de las personas; las identificaciones que la familia no pudo confirmar se mantienen separadas. La partida de José Pérez y Ana de Luelmo corrige «Marzo digo de abril» y expresa «sesenta y seis»; la fecha leída es 4 de abril de 1666. La aplicación de santos óleos no se registra como bautismo o nacimiento. Los posibles vínculos y lecturas dudosas quedan en el registro interno para su conciliación.

La familia confirmó que José Pérez y Ana de Luelmo, casados el **4 de abril de 1666**, son los padres de José Pérez Luelmo. Se incorpora José como padre y el matrimonio a ambas fichas; la familia confirmó que es distinto del José Pérez asociado a Isabel Martín y se mantienen separados. La familia confirmó también que la Juana Pascual de la partida es la madre de María Blanco Pascual: su identidad queda anotada en el registro interno, pero el tipo de evento, la fecha y el lugar no se leen con seguridad y no se añaden a su ficha. Ninguna de estas confirmaciones resuelve la identidad de Ana bautizada en 1648.

## Revisión parcial de fotografías de tatarabuelos octavos

Se han inspeccionado las 18 fotografías originales a resolución nativa. Dos imágenes muestran partes del mismo matrimonio, por lo que el inventario recoge 17 asientos. El registro interno [`sources/octavos-fotografias.json`](sources/octavos-fotografias.json) conserva las huellas, los borradores independientes, las lecturas dudosas y los motivos para no asociar los asientos pendientes. Los quince borradores sin enlace requieren revisión adicional y no se consideran transcripciones definitivas.

El matrimonio de Manuel de las Heras y Josefa Pascual se vincula a la pareja existente: coinciden ambos nombres, sus madres y el apellido y naturaleza del padre de Manuel; los nombres de los padres se leen con dificultad. Se registra en Abelón con su transcripción en ambas fichas. El año del asiento está borroso y se deja sin fecha; el asiento siguiente muestra 1814, pero no se sustituye el hueco por esa lectura. La madre de Manuel figura ya difunta, de acuerdo con la fecha de fallecimiento existente.

La partida de María Gaitán identifica como padres a Luis Gaitán y Micaela Hernández, los mismos de Domingo Gaitán Hernández. Se añade su hermana María, con bautismo en 1628 y sin lugar atribuido. La lectura del mes parece «Otubre», pero queda sin fijar. No se confunde el bautismo con el nacimiento. Las demás coincidencias de nombres no acreditan por sí solas las identidades y quedan pendientes. La familia indicó el 10 de noviembre de 2026 que las posibles identidades de Domingo Ortiz, Pascual Martín y María Simón deben quedar sin resolver por ahora, para conciliarlas más adelante.

La reconstrucción genera 1066 fichas, 235 apellidos y 87 lugares; pasan las 29 pruebas de construcción y disposición. Se mantiene el diseño de la web.

La familia trasladó las imágenes al directorio local de investigación dentro del espacio de trabajo. Sus 18 huellas coinciden con el inventario; el directorio se excluye del seguimiento de Git para conservar los originales fuera de la publicación basada en el repositorio. La revisión adicional de los quince asientos no aporta parentesco suficiente para nuevos enlaces; el registro documenta los cotejos con las familias existentes y los asientos anteriores. La María Cabrera fallecida en 1648 no es una candidata cronológicamente plausible para la madre de Antonia Pérez Cabrero, casada en 1731.

## Inicio de la revisión de imágenes sin clasificar

Se ha comenzado a revisar las 419 imágenes situadas directamente en «Register Data». El registro interno [`sources/sin-clasificar-fotografias.json`](sources/sin-clasificar-fotografias.json) conserva las huellas, transcripciones y dudas de las cuatro primeras imágenes revisadas; las demás siguen pendientes.

La partida de Isabel Martín nombra a su marido Manuel Girón y coincide con la fecha y lugar existentes de Isabel Martín Díez. Se incorpora la transcripción a su fallecimiento. La partida de Josefa Casaseca la identifica como viuda de Manuel Marqués Esteban: se incorpora su transcripción y el entierro del 21 de enero de 1753, separado de la fecha de fallecimiento ya registrada. Ambas fotografías se trasladan a «Tatarabuelos quintos». La enumeración de hijos de Josefa requiere cotejo antes de añadir filiaciones.

Los asientos de Miguel de Trigo y Antonio Piorno quedan como borradores sin vincular y sus imágenes permanecen en la carpeta inicial. El primero no identifica familiares ni localidad y su año necesita revisión; el segundo coincide en nombre y fecha con una persona del árbol, pero no indica familiares ni localidad para corroborar la atribución.

En la revisión siguiente se han examinado otras nueve imágenes. Las partidas de bautismo y entierro de Catalina Nieto Galán nombran, respectivamente, a sus padres Juan Nieto y María Galán, y a su marido Manuel Hernández Crespo. Se incorporan las transcripciones con el día y mes de cada evento, sin año: las fotografías no lo muestran. Los resúmenes de tatarabuelos quintos y sextos discrepan entre 1664 y 1661 para su nacimiento; se conserva el valor anterior en espera de conciliación. Existía ya otra toma de su entierro con el mismo nombre, y se conservan ambas en «Tatarabuelos quintos» con nombres distintos.

El matrimonio de Pedro Delgado e Isabel Montalvo identifica a ambos cónyuges y a sus cuatro padres; su entierro la identifica además por su marido y su hijo Luis. Se incorporan la transcripción del matrimonio en ambas fichas y el entierro de Isabel del 28-11-1769, separado de su fallecimiento existente. La fotografía de Isabel Delgado Martín identifica a la mujer de Felipe Moreno y fecha su entierro el 23-10-1729; aunque se llamaba «Muerte de Isabel González», el asiento dice Isabel Delgado. Su matrimonio identifica a los cuatro padres y se enlaza a ambos cónyuges. Las imágenes correspondientes se trasladan a sus carpetas generacionales.

Se enlaza el matrimonio de Antonio Moreno y Catalina Morales, y el fallecimiento de esta última el 20-12-1677, distinguiéndola de Catalina Morales Bernabé mediante su marido. Ninguno de los dos asientos muestra un lugar expreso; el matrimonio tampoco muestra el año. La lectura del testamento es parcial y queda marcada con huecos. El entierro de Felipe Moreno queda como borrador sin enlace: el nombre, la localidad y la proximidad a la fecha de muerte existente son compatibles, pero la partida no nombra familiares. Sus imágenes y las dudas de lectura se detallan en el registro interno.

## Revisión autónoma de «Register Data» (en curso)

El 10 de noviembre de 2026 la familia pidió revisar de forma autónoma todas las fotografías de «Register Data», con hipótesis razonadas en lugar de consultas, y trasladar cada imagen identificada de la carpeta inicial a la de su generación. La revisión está incompleta: se han leído las primeras 128 imágenes de la carpeta inicial por orden alfabético, hasta «Muerte de Antonio Calabaza López», y seis de las carpetas generacionales; quedan unas 275 en la carpeta inicial y las de Bisabuelos, Tatarabuelos primeros a sextos y Otros familiares.

Cada asiento, con su huella, transcripción, dudas de lectura, datos aplicados y motivo de la identificación o del descarte, figura en [`sources/sin-clasificar-fotografias.json`](sources/sin-clasificar-fotografias.json), [`sources/quintos-fotografias.json`](sources/quintos-fotografias.json) y [`sources/cuartos-fotografias.json`](sources/cuartos-fotografias.json). Las imágenes que no corresponden a nadie del árbol (homónimos descartados o familias sin enlace) permanecen en la carpeta inicial. Un asiento de bautismo se registra en `baptism` y uno de entierro en `burial`; cuando la fecha de nacimiento del árbol es en realidad la del bautismo, la nota del nacimiento lo indica. No se deduce un fallecimiento a partir de un entierro.

Cuando la partida es legible y nombra al cónyuge o a los padres, prevalece sobre los resúmenes familiares. Correcciones aplicadas: Francisco de Alcántara murió el 17-10-1688 (el 01-10-1729 era de un homónimo); Luis Gaitán e Isabel Rodríguez se casaron el 06-11-1701, no en 1703; Ana Alonso Pérez murió el 28-10-1726, no en 1720; Juan Pérez y Emerenciana Garzón se casaron el 23-11-1637, no en 1631; los matrimonios de Francisco Zamora e Inés García (24-12-1645), Juan Rodríguez Corralino y Francisca Méndez (02-02-1673) y Juan de Luelmo y Ana Nieto (11-03-1657) pasan de la fecha de la velación a la del desposorio, con la velación en la nota; Alonso Vicente Brioso Cabrero murió el 05-05-1843 y fue enterrado el 6; Francisca Pérez Bailón nació el 07-04-1701 y fue bautizada el 17; Josefa Rodríguez es hija de José Rodríguez y Engracia Martín, como decía la versión de 2019 de `TATARABUELOS SEXTOS.docx`; el bautismo de Manuel Hernández Crespo Prieto es del 22-12-1655; Antonia Pérez Cabrero era natural de Torregamones.

Se añaden veinte personas: los padres que nombran las partidas de Ana Alonso Pérez, María Marcos Martín, José Blanco Crespo, Manuel Martín Ortiz, Fernando Galán, Juan Sánchez, Josefa Rodríguez Martín y Sebastiana Mayordomo; Domingo de las Heras Prada, hermano de Ángela, y su mujer; María Terrón de la Iglesia, e Inés García, primera mujer de Manuel Hernández Gaitán. El archivo tiene 1086 personas y pasan las 29 pruebas.

Quedan sin resolver, entre otros: el nombre de la contrayente del matrimonio de Fernando Galán de 1722 (Isabel Pérez en la partida, Francisca Pérez en las demás); la madre de Teresa Delgado de Vergara (María en su matrimonio, Isabel en el árbol) y la de Martín García Cordero (María Zamora en su matrimonio); a cuál de las dos Ana Mateo corresponde el entierro de Peleas de Arriba de 1748; las siete candidatas a María de la Calle, y los asientos de Alonso Alonso (1679) y Andrés Rodríguez (1697), que no nombran familiares suficientes.

Se ha continuado con otras dieciséis fotografías de la carpeta inicial, conservando las lecturas e identificaciones en el mismo registro. Se añaden los entierros de Miguel Martín Avedillo, Luisa Alonso Delgado, Josefa Bambón, Antonio Jambrina, Antonio Morales, Manuel Hernández Crespo, Manuel Marqués Esteban y Luis Gaitán; cuando el asiento también expresa la fecha de fallecimiento, se incorpora la misma transcripción a ambos eventos. Los bautismos de Teodora Alonso, Josefa Bambón y Luis Gaitán se registran separadamente de los nacimientos previamente anotados.

El entierro de Luis Gaitán nombra a su primera mujer, Isabel Rodríguez, y a su última mujer, Teresa Calvo, y distingue los hijos habidos con cada una. Se añaden Teresa Calvo como cónyuge y Lucas, Agustina, Antonio y Francisco como hijos, conservando la filiación de Teresa Gaitán ya registrada. Los asientos de «Muerte de Teodora Alonso Delgado» y de Francisca Corralino permanecen sin vincular: el primero dice Dorotea Alonso, pese a coincidir marido y fecha, y los otros no permiten identificar con seguridad a la persona. La edad de 35 años anotada en el entierro de Luisa Alonso no coincide con la fecha de nacimiento existente; ambas lecturas se conservan sin corregir automáticamente el nacimiento.

Se han revisado veinticinco imágenes más de la carpeta inicial. Se incorporan nuevos entierros y transcripciones de Bernardo Calvo Martín, Bernardo Gaspar, Antonio Moreno, Atilana de Luelmo, Atilano Carretero, Baltasar Brioso, Atilano Zurdo, Baltasara Pérez, Bernardo Rabanal, Catalina Cabrero, Catalina Delgado y Catalina Jorge, además de las transcripciones de Basilisa Sánchez y dos mujeres llamadas Catalina Marqués. La partida de Baltasara Pérez fecha expresamente tanto su muerte como su entierro; la de Atilano Carretero da día y mes, pero el año queda parcialmente oculto y no se atribuye automáticamente el del asiento siguiente.

El entierro de Bernardo Gaspar nombra a su mujer Ana Piorno y a sus hijas Sebastiana, Manuela, Teresa y Josefa; se incorporan las tres últimas, separando a Manuela de una homónima fallecida anteriormente. El asiento llama «Theresa Olmedo su madre» a una de las ofrendaderas: no se altera la madre registrada de Bernardo, pues la expresión puede referirse a la madre de Ana. Las fotografías de Blas Gonzalo, Blas Salvador, Casilda Hernández y Catalina Gonzalo quedan con lecturas provisionales sin enlace seguro. La partida de Catalina Marqués Portales dice 27-04-1775 mientras el dato previo dice 26-04-1775: se conserva este último y se hace constar el contraste en su ficha y en el registro interno.

Otras once imágenes se han revisado: una es otra toma del entierro de Catalina Nieto ya incorporado; se añaden las partidas de Catalina Matos, Domingo Maíllo, Domingo Gaitán, Emerenciana Garzón y Emerenciana Martín. El entierro de Emerenciana Garzón solo muestra el 20 de octubre, sin año; las imágenes de Diego de Arroyo y Domingo Fierro permanecen sin atribución mientras se aclaran las identidades. En el entierro de Catalina Matos constan el 19-02-1832 y el fallecimiento el 17 del mismo mes en Peleas de Arriba.

En una nueva revisión se han examinado veinticuatro fotografías. Se incorporan las partidas de Francisca Franco, Francisca Salvador, Emerenciana Diego, Engracia Galán, Esteban Martín, Fernando Galán, Francisco Bragado, Francisca Carbajal, Francisca Pérez, Francisco Hernández, Francisco Carbajal, Francisco Carretero Galán, Francisco de Mena Román, Francisco de Zamora y Francisco González. Los múltiples originales de una misma partida permanecen agrupados; las lecturas y huecos figuran en el registro interno. Se añade María Linares como segunda esposa de Francisco González, conforme a la partida que también nombra a su primera esposa Isabel Vara y a su hija Francisca.

Quedan sin atribuir las imágenes de Esteban Carretero, Francisco de Mena Miguel y Francisco de Prada. En la de Mena el padre coincide, pero la madre figura como Ana Miguel y el árbol conserva Juana Miguel. La partida de Francisco de Zamora expresa muerte el 03-12-1723 mientras el árbol conservaba el día 2; se conserva la fecha previa y se anota el contraste. Las fechas de entierro no se convierten automáticamente en fallecimientos; se mantienen las edades aproximadas y los datos anteriores cuando difieren.

En la sesión siguiente del 10 de noviembre de 2026 se leyeron otras 74 imágenes de la carpeta inicial, de «Muerte de Francisco Martín Cabrero» a «Muerte de Magdalena Rodrigo», y nueve de las carpetas generacionales necesarias para resolver dudas. Correcciones aplicadas a partir de las partidas: Francisco Zamora García murió el 03-12-1723, como decía la versión de 2019 de `TATARABUELOS SEXTOS.docx`, y se sustituye la lectura anterior de su asiento por la completa; Inés Brioso Luelmo murió el 14-12-1752, no en 1742; Juan Nieto murió el 16-05-1680; Juana Alonso Jurado murió el 29-02-1712; Juan Cabrero y María Luelmo se desposaron en abril de 1690 y el 17 de agosto es la velación; los fallecimientos de Inés Hernández Villar, Inés Marqués y Catalina Garrote pasan al día anterior porque la fecha que tenían era la del entierro. El fallecimiento del 02-12-1706 que el lote SEXTOS dejó pendiente corresponde a Juan Vega, marido de Magdalena Rodrigo. «Leonarda Pérez», mujer de Bonifacio de Paz, es Eduarda Pérez Ponce: lo advierte la nota de su partida de matrimonio. La imagen «Muerte de Isabel Martín Jorge» es el entierro de su madre, Teresa Martín Jorge, y se renombra. Se añade María Delgado González, hermana de Luis. El archivo tiene 1096 personas y pasan las 29 pruebas.

Quedan por leer unas 125 imágenes de la carpeta inicial, a partir de «Muerte de Luis Martín Cordero», y las carpetas generacionales. Siguen sin enlazar, entre otros, los asientos de Luis Alonso (1666), Josefa Carrasco, mujer de Agustín de Llamas, y Juan Pérez, vecino de Gema (1661); el apellido «Pérez» que las partidas dan a María Luelmo, mujer de Juan Cabrero, se conserva como observación.

**Tercera sesión (10-11-2026).** Se leyeron las fotografías sueltas restantes de «Muerte de…» (de «Muerte de Manuel Martín» a «Muerte de Úrsula Martín»). No hay fichas nuevas (1.115 personas): se añaden transcripciones, entierros, fallecimientos y observaciones. Correcciones por lectura directa: Manuel Martín Ortiz falleció el 02-01-1726 (entierro el 3); María Carrascal de Trigo, el 10-07-1749; María Grande Bambón fue enterrada el 20-03-1716; María Gómez Herrero falleció el 21-12-1724; María Zamora fue tercera mujer de Antonio Moreno; Susana Pérez, mujer de Luis Alonso, falleció el 05-08-1700 (año deducido del orden del libro; la partida no nombra marido). Firmas normalizadas: Félix Rodríguez Armenteros (Gáname, 1714-15) y Antonio Machargo de Casso (Moraleja, 1684-1716). Quedan sin enlace, en la carpeta raíz: «Muerte de María Jurado», «Muerte de María Rodrigo 2», «Muerte de Pedro Carrascal Hernández» y «Muerte de otro Pedro Garrote». Pendiente: 38 fotografías sueltas sin leer (34 «Nacimiento de…» y cuatro más) y las carpetas de generación. Lecturas hechas y aún sin incorporar: Susana Pérez Galán, bautizada en Casaseca el 09-11-1627, hija de Antón Pérez y María Galán (es la mujer de Luis Alonso); Susana Pérez Delgado, hija de Juan Pérez e Isabel Delgado, bautizada un 11 de noviembre hacia 1624 por Francisco Martínez (sería la madre de Juan Rodríguez Pérez; año por confirmar).

**Cuarta sesión (11-11-2026).** Se releyeron a resolución nativa las fotografías sueltas que seguían como provisionales y se cotejaron con siete matrimonios y un bautismo de las carpetas generacionales. Se enlazan 28 imágenes más y la reconstrucción pasa a 1.137 fichas (21 nuevas). En la carpeta inicial quedan 62 imágenes, todas leídas y sin enlace; el registro explica cada caso.

Bautismos incorporados, con padres nuevos: Antonio Moreno Isidro (15-02-1642), Susana Prieto Grande (28-03-1627), Susana Pérez Galán (09-11-1627), Francisca Corralino (1646, antes del 26 de mayo), Francisco González Pérez (septiembre de 1646), María Pérez Delgado (22-09-1663), Luisa Perdigón Aguilar (24-05-1673) y Pascual Martín Perdigón (Arcenillas, 09-04-1606). Lorenza Cabrero de la Calle (22-08-1657) se enlaza con los padres ya registrados de Juan Cabrero de la Calle, de quien resulta hermana. Isabel de Urueña (05-08-1680) se enlaza aunque el bautismo llama a su madre María Alexandro y el matrimonio María de Arenas. En todos ellos el matrimonio o el entierro de la persona no nombra a sus padres: la identificación es la que hizo la familia al nombrar la imagen, con lugar y cronología coherentes, y así consta en el registro. Los nombres se amplían con el segundo apellido que da el bautismo.

Había dos Susana Pérez en Casaseca de las Chanas. La mujer de Luis Alonso es Susana Pérez Galán. La madre de Juan Rodríguez Pérez, pendiente de enlace desde el lote SEXTOS, es Susana Pérez Delgado, bautizada el 11-11-1624, hija de Juan Pérez e Isabel Delgado: se crea su ficha y se enlaza. La antepasada que los resúmenes llaman «Francisca Lozano o Corralino» figura como Francisca Corralino en su bautismo y en su entierro (24-11-1709, «biuda de Andrés Rs»); se conserva el nombre Francisca Lozano y se anota la variante. Su marido, Andrés Rodríguez, murió el 12-10-1697.

Fallecimientos y entierros incorporados: Felipe Moreno Morales (entierro el 23-09-1750), Teodora Alonso Delgado (28-09-1704; la partida dice «Dorotea» y el margen corrige), Blas Salvador (13-09-1702), Blas Gonzalo (26-11-1703), Manuel Girón (12-03-1744), Domingo Fierro (entierro el 25-09-1754, viudo de Ana Piorno), Manuel Sebastián Lorenzo (30-08-1761), Casilda Hernández Lachón (24-10-1780, viuda de un segundo marido, Lorenzo Gutiérrez), Esteban Carretero Arias (entierro el 18-03-1778), Manuel Montalvo Martín (entierro el 06-04-1707), Josefa Carrasco Gil (entierro un 9 de septiembre entre 1761 y 1766, como mujer de Agustín de Llamas) y Luis Alonso (entierro el 17-08-1666).

Correcciones por lectura directa de los matrimonios: Juan Brioso Luelmo y María Marqués se desposaron el 20-02-1708 (el 11-10-1708 es la velación); Juan Martín Esteban y Lorenza Cabrero, viuda de Alonso Nieto, se casaron el 31-07-1684 (los resúmenes decían «31-06-1684»); Alonso Román era natural de Arcenillas, no de Morales del Vino, y viudo cuando casó con Luisa Perdigón. Se transcriben además los matrimonios Cabrero–Marqués (1710), Brioso–Cabrero (1748) y Brioso–Martín (1779).

Inés Marqués, mujer de Francisco Cabrero Luelmo, sigue sin padres. La Inés bautizada el 21-12-1686, hija de Juan Marqués y María Esteban, no es ella sino una hermana de María Marqués Esteban: en 1748 los hijos de una y otra se casaron con dispensa de cuarto con cuarto y de tercero con cuarto grado, no de segundo. Se registra como Inés Marqués Esteban, pariente colateral. La bautizada el 07-11-1686, hija de Diego Marqués y María Nieto, queda como candidata sin enlace. También es colateral Andrés Rodríguez Méndez (óleos el 21-12-1678), hermano de Miguel Rodríguez Méndez.

Pista sin incorporar: una nota marginal de noviembre de 1709 en el libro de difuntos de Casaseca dice que una Gregoria Moreno murió en Peleas de Abajo «yendo a ver a su hijo» y está enterrada allí; puede ser Gregoria Moreno Morales. Siguen sin enlace por falta de prueba, entre otras, «Muerte de Alonso Alonso» y «Muerte de María Jurado» (incompatibles entre sí), «Muerte de Juan Pérez», «Muerte de Ana Mateo», «Nacimiento de Alonso Hernández» y «Nacimiento de Manuel Marqués Rodríguez». Pendiente: las fotografías de las carpetas generacionales que nunca se han transcrito (unas 1.100), empezando por las generaciones más próximas.

**Quinta sesión (11-11-2026): bisabuelos y tatarabuelos primeros.** Se han transcrito las 55 fotografías de las carpetas «Bisabuelos» (15) y «Tatarabuelos primeros» (40), que no se habían leído nunca: bautismos, matrimonios y entierros de los ocho bisabuelos paternos de Bernardo y de sus dieciséis padres. No hay fichas nuevas (1.137 personas). Los registros son `sources/bisabuelos-fotografias.json` y `sources/primeros-fotografias.json`. Las fechas de los resúmenes familiares coinciden con las partidas salvo una: Nicanor Calvo Martín falleció el 22-06-1893 (la partida dice «veintidós»; el resumen daba el 21), de «tabes dorsal». Se añaden los entierros que faltaban, las horas de nacimiento y fallecimiento que expresan las partidas y observaciones con hijos, viudedades y segundos matrimonios (Nicanor Calvo era viudo de Anastasia Calle al casarse en 1856; Balbina Pérez, viuda de Julián Garrote en 1877).

Dos imágenes terminan antes del final del asiento (entierro de Benito de las Heras, bautismo de Carlos Santiago) y al bautismo de Josefa Rabanal le falta el comienzo, que está en la página anterior. «Josefa Rabanal Arroyo2» es el entierro de Josefa Rabanal Ibáñez: «Arroyo» es el apellido del cura. Correcciones de firmas en asientos ya incorporados: el párroco de San Esteban de Zamora en 1831-33 es Manuel Peña (no «Manuel Pérez»), en los entierros de Vicenta Martínez y José Rabanal, y el escribano del testamento de este es Eustasio Catalán; el de Tardobispo en 1835-42, Gregorio Garrote de Pedro.

Pendiente: las carpetas «Tatarabuelos segundos» (unas 80 imágenes sin transcribir), terceros (153), cuartos (258), quintos (297), sextos (175), séptimos (49), «Otros familiares» (88) y «Abuelos» (9, cuyas partidas ya están transcritas en las fichas).

**Sexta sesión (11-11-2026): inicio de tatarabuelos segundos.** Se revisan catorce fotografías que contienen doce partidas, documentadas con huellas, transcripciones y criterios de identificación en [`sources/segundos-fotografias.json`](sources/segundos-fotografias.json). Los bautismos de Antonia Feltrero, Ángela Vega, Baltasar Brioso, Bernarda Esteban, Diego Benito Calvo, Luisa Alonso Alonso, Fernando Maíllo y María Juana Morales coinciden con sus padres y demás datos del árbol; los matrimonios Calvo–Alonso y Maíllo–Morales identifican también a ambos contrayentes por sus padres. Se incorporan los bautismos y las transcripciones matrimoniales, y los entierros de Antonia Feltrero y Francisco Tuda, identificados por el cónyuge. No se añaden personas nuevas.

La partida de Antonia dice que nació el **12 de junio de 1775**, y fue bautizada el 13; el resumen familiar daba el 12 de julio. Se corrige el nacimiento y se conserva la discrepancia en la ficha. Su entierro de 1848 le atribuye 64 años, incompatibles con ese nacimiento; la edad queda anotada. El entierro de Francisco Tuda es del 26 de noviembre de 1841, pero no expresa la fecha de muerte: se mantiene la fecha previa del resumen con una nota. El bautismo de Luisa Alonso es del 20 de febrero de 1751 y no expresa cuándo nació; se conserva la fecha de nacimiento del resumen, con esta salvedad. Ese asiento llama natural de Roales a su abuela Antonia Ufano, cuyo nacimiento figura en Morales del Vino; la discrepancia queda pendiente de cotejo. Baltasar Brioso recibe también el nombre Eusebio en su bautismo.

De las 87 fotografías de esta carpeta, 21 tienen huella en los registros de revisión y 66 todavía no figuran en ellos. Quedan también fotografías sin transcribir en las demás carpetas generacionales.


**Séptima sesión (11-11-2026): inicio de tatarabuelos terceros.** Se han leído 17 fotografías correspondientes a 15 partidas, registradas con sus huellas y criterios en [`sources/terceros-fotografias.json`](sources/terceros-fotografias.json). Se incorporan catorce partidas a las fichas existentes: bautismos de Agustina Garrote, Alonso Santiago, Andrés Méndez, Alonso de las Heras, Tomasa Porras, Teresa Piorno y Teresa Vega; matrimonios Santiago–Garrote, Méndez–de Lera y de las Heras–Domínguez; y partidas de fallecimiento o entierro de Agustina Garrote, Bernardo Morales, Antonia Valladolid y Teresa Terrón. No se crean personas nuevas. Los parentescos expresos, fechas y lugares apoyan las identificaciones; cuando el asiento no nombra padres o cónyuge, el registro explica los límites de la atribución. El matrimonio de Alonso Santiago y Agustina remite a una fecha que no aparece en la fotografía: se conserva la fecha previa del árbol. Alonso de las Heras consta viudo de Rosa Simón en su matrimonio con Mónica Domínguez.

El bautismo de Teresa Piorno llama Ana a su madre, que el árbol identifica como Antonia Burrieza; coinciden el padre, los cuatro abuelos y la fecha de nacimiento. La discrepancia queda registrada sin modificar la filiación. El bautismo de Teresa Terrón coincide en los padres y abuelos, pero el mes está oscuro y parece enero, frente a junio en el árbol; se conserva como transcripción provisional sin cambiar las fechas. El entierro de Antonia Valladolid le atribuye 64 años, frente a los 57 cumplidos según el nacimiento registrado; también nombra a María y Juana por separado, sin que se presuponga su identidad con María Juana. Las dudas quedan en el registro de fuentes.

De las 172 fotografías de la carpeta, 38 tienen ya huella en algún registro de revisión y 134 siguen sin registrar. Una fotografía puede contener solo parte de una partida, y algunas habían sido leídas anteriormente en otro lote.

**Octava sesión (11-11-2026): tatarabuelos segundos completos.** Se han leído las 66 fotografías que quedaban en la carpeta «Tatarabuelos segundos» y se han cotejado con las imágenes las doce partidas de la sexta sesión. Las 87 fotografías de la carpeta tienen ya asiento en [`sources/segundos-fotografias.json`](sources/segundos-fotografias.json) o en el registro de la carpeta inicial. No hay fichas nuevas (1.137 personas). Las treinta y dos personas de esa generación reciben sus partidas de bautismo, matrimonio y entierro, con las velaciones, las segundas nupcias, los hijos y los herederos que expresan.

Correcciones a los resúmenes familiares por lectura directa: Manuel Sánchez Durán fue enterrado en El Cubo el 18 de julio de 1814 (el resumen daba el fallecimiento el 17-09-1814, con el mes equivocado), de modo que el fallecimiento pasa al 17-07-1814. En dos casos la fecha de fallecimiento del resumen era la del entierro y la partida no expresa otra: conforme al criterio de la familia, el fallecimiento se sitúa el día anterior (Francisco Tuda Porras, 25-11-1841; Josefa Pascual Lorenzo, 06-08-1863). Las fechas de nacimiento de Luisa Alonso Alonso (20-02-1751) y de Manuel Martín de Prada (25-11-1776) son en realidad las de sus bautismos; las partidas no expresan el nacimiento y se anota así. Tres nombres se amplían con los que da el bautismo: Baltasar Eusebio Brioso Martín, José Luis Francisco Rabanal Martínez y Miguel Manuel Cecilio Pérez Roncero. Tres bautismos de necesidad se fechan el día en que se administraron, con las ceremonias posteriores en nota (José Sastre, Manuel de las Heras y Margarita Girón).

Rectificaciones a la sexta sesión tras cotejar las imágenes: el bautismo de Luisa Alonso Alonso llama a su abuela Antonia Ufano «natural de Morales», no de Roales, y se retira la observación que recogía esa supuesta discrepancia; en el de Bernarda Esteban la abuela paterna es «natural de Tudera»; el testigo de los bautismos de Fernando Maíllo y María Juana Morales es «Ubaldo de Silba», y el cura que bautizó a Ángela Vega firma «Domingo de la Cagiga» (leído «de la Sagra» en esta sesión y corregido en la novena). Las notas de las fichas ya no remiten al resumen familiar. En dos bautismos de la quinta sesión la firma es «Dn Manuel Fernández», no «Fr.».

Identificaciones que conviene conocer: el entierro de Josefa Pascual (1863) la llama «viuda de Manuel Magarro», no de Manuel de las Heras, su marido en el árbol; se enlaza por el nombre, el lugar, la edad y la identificación de la familia, y la duda queda en el registro. El de Josefa Garrote (1842) la llama viuda de Manuel Delgado, un segundo marido, y da ese apellido a su hijo Carlos. El de Manuel Sánchez Durán llama «Rosa Sánchez» a su mujer, y el de Rosa Izquierdo llama «Francisco Sánchez» a su primer marido. «Luisa Alonso González» (1788) es una tercera mujer de ese nombre, ajena al árbol, y «Muerte de Baltasar Brioso Alonso» es el fallecimiento de Baltasar Brioso Martín. Varias imágenes no muestran el final del asiento (José Sastre, Manuel Piorno, Manuel Sánchez Durán) y el registro lo indica.

Pendiente: las carpetas «Tatarabuelos terceros» (134 imágenes sin registrar), cuartos (255), quintos (295), sextos (173), séptimos (48), «Otros familiares» (88) y «Abuelos» (9).

**Novena sesión (11 y 12-11-2026): tatarabuelos terceros completos.** Se han leído las fotografías que quedaban en la carpeta «Tatarabuelos terceros» y se han cotejado de nuevo con las imágenes las quince partidas de la séptima sesión, varias de las cuales tenían huecos. Las 172 fotografías de la carpeta tienen ya asiento: 156 en [`sources/terceros-fotografias.json`](sources/terceros-fotografias.json) y 16 en el registro de la carpeta inicial. No hay fichas nuevas (1.135 personas). De las 64 personas de esa generación, 61 tienen ya transcrito su bautismo, 48 su matrimonio y 53 su fallecimiento o entierro, con las velaciones, las dispensas, las segundas nupcias, los testamentos, los hijos y los herederos que expresan las partidas.

Correcciones a los resúmenes familiares por lectura directa:

| Persona | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| Atilano Pascual y Teresa Lorenzo | Matrimonio el 23-11-1793 | 05-11-1793 | El 23 fueron las velaciones, anotadas al pie; el desposorio fue el 5. |
| Bernardo Feltrero Esteban | Nació el 29-12-1731 | 29-12-1730 | El bautismo, del 7 de enero de 1731, dice «el día veinte y nuebe de diciembre del año de treinta». |
| Bernardo Feltrero Esteban | Sin fallecimiento | 27-02-1777 | La partida solo expresa el entierro, el 28 de febrero de 1777; se registra el día anterior. |
| Juana Ramos Martín | Nació el 29-06-1783 | 20-06-1783 | El bautismo, del 24 de junio, dice «nació el día veinte del mismo». |
| Micaela Antón Figal | Nació el 12-03-1747 | 04-03-1747 | El 12 es el bautismo; la partida dice «nació día quatro del dho». |
| Mónica Domínguez Martín | Nació el 30-10-1765; bautismo el 09-11-1765 | 30-11-1765 y 09-12-1765 | El escribano puso «Nobiembre» y se corrigió en la misma línea: «digo Diciembre». |
| Manuela Vicenta Martínez Juárez | Bautismo el 13-07-1771, San Torcuato | 13-06-1771, San Lázaro | La partida es de junio, del libro de San Lázaro, extramuros; San Torcuato es la parroquia natal del padre. |
| Gabriel Ibáñez Pérez | Bautismo en San Torcuato | San Lázaro | La partida es del libro de San Lázaro, extramuros. |
| Francisco Alonso Ufano | Falleció el 13-02-1782 | 13-12-1782 | El entierro es del 14 de diciembre de 1782, entre asientos de noviembre y de enero; el resumen tenía el mes equivocado. |
| José Piorno Zurdo | Falleció el 02-03-1779 | 11-02-1813 | El entierro es del 12 de febrero de 1813 y lo llama viudo de Teresa Piorno; el de ella, de 1791, lo da por vivo. La fecha anterior repetía el día y el mes de su boda. |
| Lucas Esteban Prieto | Falleció el 13-05-1819 | 12-05-1819, en Fadón | El 13 es el entierro; la partida dice que murió el 12. |
| Teresa Vega Zurdo | Falleció el 30-06-1833 | 28-06-1833 | El 30 es el entierro; la partida dice que falleció el 28. |

Las fechas de nacimiento de Isabel Alonso Zamora (29-01-1714), Manuel Hernández Gaitán (03-04-1729) y Miguel Martín Avedillo (26-02-1748) son en realidad las de sus bautismos; las partidas no expresan el nacimiento y se anota así. En cuatro entierros la partida no dice el día de la muerte y el árbol ya la situaba el día anterior, conforme al criterio de la familia: Catalina Durán (1804), Gabriel Ibáñez (1801), Isabel Alonso Zamora (1791) y Teresa Lorenzo (1853). Pedro Calvo Pérez recibe el bautismo que le faltaba (28-11-1716) y Catalina Durán el suyo (01-10-1734; la partida dice «deste presente año», el de su nacimiento). Siete nombres se amplían con los del bautismo: Bernardo Víctor Rabanal Fernández, Francisca Antonia Martín Pérez, Gabriel Antonio Ibáñez Pérez, Isabel María Delgado Ramos, Juana del Sacramento Ramos Martín, Salvador Pedro Bragado Macías y Manuela Vicenta Antonia Martínez Juárez. El bautismo de Águeda Fierro, de necesidad, se fecha el día en que se suplieron las ceremonias, porque la partida no dice cuándo la bautizó el cura.

Dudas que quedan en el registro y conviene conocer:

- El bautismo archivado como «Josefa Valladolid Ocampo» (25-02-1767) es el de una niña a la que se puso por nombre Josefa. El árbol atribuía su fecha de nacimiento, 18-02-1767, a Antonia Valladolid Ocampo, a quien su matrimonio y su entierro llaman Antonia. Se enlazó con ella, con una nota en el bautismo; el entierro le da 64 años en 1824 y sus padres casaron en 1759, de modo que Josefa podría ser una hermana menor. **Rectificado en la décima sesión:** el entierro de su padre, Francisco Valladolid (1799), nombra a sus dos hijas, Antonia y Josefa; el bautismo pasa a una ficha nueva de Josefa y Antonia queda nacida hacia 1760.
- El mes del bautismo de Teresa Terrón Campo está enmendado: sobre la palabra original se escribió «Henero» con otra tinta. Se conservan las fechas del árbol (8 y 15 de junio de 1743).
- El bautismo de Joaquina Roncero (22-03-1748) empieza diciendo que nació ese día y añade entre paréntesis «q nació el día tre de este mes». Se conserva el nacimiento del árbol, con una nota.
- «Juan Pérez Miguel b» es el bautismo de un hermano mayor del mismo nombre (1740), con la nota marginal «murió»; queda sin enlazar.
- Segundas y terceras nupcias que el árbol no recogía: Catalina Gonzalo consta en su entierro como viuda de Miguel Vega; Fernando Girón, como marido de María Alonso; Alonso de las Heras casó cuatro veces. Constan como observaciones, sin fichas nuevas.

Firmas corregidas por comparación entre partidas, también en las sesiones anteriores: el cura de Gáname de 1744 a 1763 es Tomás Sáez de Angulo y Varredo (un bautismo de 1747 escribe entero «Sáez de Varredo»; su firma abreviada pasa de «Rz» a «Sz»), y el de 1767 a 1777, «Domingo de la Cagiga»; «fr. Joseph Ygnº de Castro» firma el matrimonio Feltrero–Gonzalo; «Barme Díez Berde», el bautismo de Bernardo Morales; «Dn Bernardo Roncero», sin más palabras, el de Margarita Girón. En las partidas de la séptima sesión, el testamentario de Agustina Garrote es Pedro Santiago; el de Antonia Valladolid, José Perdigón, y Teresa Terrón pidió el hábito «de la Aldea».

Pendiente: las carpetas de tatarabuelos cuartos (255 imágenes sin registrar), quintos (295), sextos (173), séptimos (48), «Otros familiares» (88) y «Abuelos» (9).

**Décima sesión (12-11-2026): tatarabuelos cuartos completos, con sus hermanos.** Se han leído las 255 fotografías de la carpeta «Tatarabuelos cuartos» que no tenían asiento. Las 293 fotografías de la carpeta tienen ya asiento: 260 en [`sources/cuartos-fotografias.json`](sources/cuartos-fotografias.json), con 224 asientos, y 33 en el registro de la carpeta inicial. Las 38 que ya estaban registradas se dejaron como estaban, salvo una firma. De las 125 personas de esa generación, 100 tienen ya transcrito su bautismo, 91 su matrimonio y 94 su fallecimiento o entierro, con las velaciones, las dispensas, los bautismos de socorro, los testamentos y los herederos que expresan las partidas. Por indicación de la familia, el árbol representa ahora también a los hermanos: se añaden 67 fichas (1.474 personas en total), de las que 65 son hermanos o hijos que nombran las partidas y dos son madres que faltaban.

Correcciones a los resúmenes familiares por lectura directa:

| Persona | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| Antonia Alcántara Pérez | Nació y fue bautizada el 19-01-1709 | 20-01-1709 | La partida dice «En veinte días»; la bautizaron el mismo día. |
| Ana María Martín Rodríguez | Nació el 30-10-1704 | 21-10-1704 | El 30 es el bautismo; la partida dice que «avía nuebe días que era nazida». |
| Antonia Burrieza Salvador | Bautismo el 01-01-1713 | 21-12-1712 | La bautizaron de necesidad en casa el 21; el 1 de enero recibió los óleos. |
| Baltasar Brioso Marqués | Bautismo el 13-04-1725 | 11-04-1725 | La partida dice «onze». |
| Diego Martín y María Avedillo | Matrimonio el 10-07-1738 | 02-07-1738 | La partida dice «a dos días del mes de Julio». |
| Francisco Sastre y Ana Delgado | Matrimonio el 26-01-1775 | 26-01-1771 | «Mil setecientos setenta y uno»; el asiento siguiente es de mayo de 1771 y su hija Antonia nació en 1772. |
| Jerónimo Calabaza Gutiérrez | Nació el 14-08-1727 | 11-08-1727 | La partida rehecha en 1742 y la nota de 1727 dicen «a onze de Agosto». |
| José Antón Almaraz | Bautismo el 05-02-1711 | 28-01-1711 | Lo bautizaron de necesidad al nacer; el 5 de febrero recibió los óleos. |
| Juan Gonzalo Diego | Nació el 11-09-1698 | 04-09-1698 | El 11 es el bautismo; la partida dice que nació el día cuatro. |
| Manuel Alonso Pérez y Antonia Ufano | Matrimonio el 26-11-1705 | 16-11-1704 | El 26-11-1705 son las velaciones, anotadas al margen. |
| Manuel Méndez y Ana María Martín | Matrimonio el 10-06-1743 | 18-03-1743 | El 10 de junio son las velaciones, anotadas al pie. |
| Manuel Pascual y Josefa Villar | Matrimonio el 10-05-1762 | 22-03-1762 | El 10 de mayo son las velaciones, anotadas en la misma página. |
| María Manuela Fernández García | Bautismo el 11-01-1740 | 27-12-1739 | La bautizaron de socorro el 27, enferma; el 11 de enero se suplieron las ceremonias. |
| María Peña Domínguez | Nació el 24-09-1714 | 08-09-1714 | El 24 es el bautismo; la partida dice que nació el sábado 8. |
| Pedro Garrote Morales | Nació el 18-06-1713 | 06-06-1713 | El 18 es el bautismo; la partida dice que nació el día seis. |
| Francisco Valladolid Carbajal | Falleció el 02-01-1799 | 12-01-1799 | La partida dice «falleció en doze». |
| Josefa Villar Ortizo | Falleció el 14-08-1782 | 14-08-1792 | La partida dice «nobenta y dos»; el asiento siguiente es de septiembre de 1792. |
| Margarita Pereruela Hernández | Falleció el 04-10-1780 | 04-11-1780 | La partida dice «En quatro de Noviembe»; el asiento anterior es del 7 de octubre. |
| María Esteban Roncero | Falleció el 08-12-1735 | 09-12-1735 | La partida dice que murió «a nuebe de diziembre». |
| María Pérez Blanco | Falleció el 29-08-1738 | 30-08-1738 | La partida dice «En treinta de Agosto… murió». |
| Ángela Campo Delgado | Falleció el 25-12-1764 | 25-12-1774 | El entierro, del 26, dice «mill setecientos setenta y quatro». |
| Antonia Valladolid Ocampo | Nació el 18-02-1767 | Hacia 1760 | Ese bautismo es el de su hermana Josefa (véase la novena sesión). |

El árbol no tenía fechas para Esteban Martín Marqués (nacido el 02-08-1737 y bautizado el 14 en Morales del Vino), Lorenzo Feltrero Calles (nacido el 30-07-1707 y bautizado en agosto en Fadón; el día se perdió con la página rota) ni Lorenzo Roncero Herrero (nacido el 06-08-1712 y bautizado el 18 en Tardobispo). En diecisiete personas la fecha de nacimiento era en realidad la del bautismo y se anota así; en Luisa Martín Izquierdo es la de los óleos y en María Manuela Fernández, la del bautismo de socorro. Cuatro nombres se amplían con los del bautismo: Antonio José de Paz Andrés, Emerenciana Francisca García Martínez, María Manuela Fernández García y Silvestre Eugenio Martínez Martínez. Los bautismos de necesidad se fechan el día en que se administraron, con las ceremonias en la nota. La partida de Pedro Garrote Morales (1749) no deja claro si el 13 de julio es el día de la muerte o el del entierro, y se mantiene la muerte el 12.

Hermanos añadidos a partir de las partidas. Con sus dos padres, cuando la partida los nombra o nombra a la madre como viuda o mujer del padre: Andrés Piorno Garrote, gemelo de Manuel; Manuela Tomasa Barrocal Melado, hermana de Josefa (la imagen lleva su nombre, pero la antepasada se llama Josefa en su matrimonio y en su entierro); Manuel (1779) y Paula (1771) Pérez Roncero; Josefa y fray Santiago Valladolid Ocampo; Manuel Martín Carrascal; Gregorio e Isabel Sastre Delgado; Ramona de Lera Rodríguez; Ángela Alonso Zamora; Jacinta Calvo Pérez, mujer de Juan de Alcántara, de Venialbo; Blas, Juan y María Alonso Cabrero, y Gabriel, que ya estaba como hermano de Bernardo y se enlaza ahora con sus padres; fray Alonso, Juan y Lorenzo Martín Avedillo; Francisco Feltrero Esteban; Pedro e Inés Santiago Garrote; Manuel, Francisca, Bernardo y Miguel Roncero Hernández; Juan, José, Teresa y Jerónima Roncero Pérez; Alonso Rodríguez Alonso, que solo consta en el índice del libro de bautismos, y Juan, Alonso y Catalina Garrote Andrés, por el entierro de su madre, Inés Andrés, que se leyó en la carpeta de los sextos para identificar a Alonso Garrote, padrino y «tío» de sus sobrinos Pascual y María. Solo con el padre, cuando la partida no nombra a la madre o el padre casó dos veces: Petrona, Alonso y Francisco Terrón; Marcos Vega Zurdo; Domingo Maíllo; Felipa y Bernarda Rodríguez; Venancio Lorenzo Martín, a quien el entierro de su padre aparta de los hijos legítimos; Fernando, Luis, José y Ana María Delgado Ramos; Paula, Polonia, Rafael, José y Alonso Domínguez, de una de las dos mujeres de su padre; Luis Méndez, de un matrimonio anterior de su padre, y Antonia Garrote, ya difunta en 1779. Solo con la madre: Serafín, Isabel y Alonso Pascual Villar, y Francisco, Teresa y Dionisia de las Heras Pozo. Como hermanos sin padres conocidos, con el enlace recíproco de `siblings`: Juan Marqués, hermano de María Marqués Casaseca; Sebastiana Esteban, hermana de María Esteban; Manuel Garrote, hermano de Pedro Garrote Morales, y Custodio Alonso Salvador, cura de Morales de Toro, a quien el bautismo de Nicolás Alonso Zamora llama tío del niño: se le tiene por hermano de Bernardo Alonso Salvador por el parentesco y por los dos apellidos. Se añade también a Cristóbal Santiago Garrote, hijo de Alonso Santiago y Agustina Garrote, muerto párvulo en 1779. Las madres nuevas son María Rodríguez, natural de Pereruela, madre de Jerónima Martín Rodríguez, y Ana Melado, de Salce, madre de Micaela Esteban. Los apellidos que las partidas no dan se deducen de los padres y se advierte en cada ficha.

Dudas que quedan en el registro y conviene conocer:

- La dispensa del matrimonio de Pascual Garrote y María Garrote (1741) es de cuarto grado de consanguinidad, pero en el árbol sus padres, Marcos y Domingo Garrote, son hermanos, lo que los haría primos hermanos. No se cambia nada.
- El bautismo de María Terrón (1683) llama «aguelos» a los padrinos, Miguel Terrón y Catalina Manzano, pero el árbol da por muertos en 1679 a su abuelo Miguel Terrón y a la mujer de este, Inés de la Iglesia.
- El bautismo de Ángela Campo Delgado llama a su madre Ysabel Calbo; su matrimonio y el bautismo de su hija, Ysabel Delgado, como el árbol. Francisca Isabel Ocampo figura como «Ysabel Fernández del Campo» en su matrimonio y en su entierro, y Jerónima Pérez Luelmo como «Gerónima María» en su matrimonio. Son diferencias de nombre y se dejan como están.
- Emerenciana García murió en 1791 como mujer de Andrés Maíllo, y Manuela Garrido en 1764 como mujer de Domingo Santiago; serán Andrés Maíllo Díez y Domingo Santiago Mateos, viudos de Teodora Hernández y de Teresa Garrote, pero las partidas no lo dicen y no se enlazan como matrimonios.
- No se añaden, por falta de datos: el segundo y el tercer heredero de Manuel Alonso Pérez (1718), cuyos nombres no se leen en una fotografía desenfocada; Miguel Vega, «tío carnal» de Miguel Vega Zurdo, a quien no nombran entre sus hijos los entierros de sus supuestos padres, y un niño bautizado el mismo día que Águeda Gonzalo (1731) y nacido el mismo día, cuyos padres quedan fuera de la imagen.
- Los bautismos de Pedro Salvador (1679) y de Vicente Martín (1744) están muy desvaídos: no se leen el día del primero ni casi nada del segundo, y se mantienen las fechas del árbol.
- Quedan sin enlace tres bautismos de homónimos: Juan Gonzalo Gallego (1706), María Rosa Ramos Martín (1717) y Ángela Macías Franco (1754), que no puede ser la antepasada, Ángela Macías Manzano, nacida en 1727. La carpeta de los quintos guarda imágenes de los padres de esta última homónima.

Firmas corregidas por comparación entre partidas: el cura de Morales de 1713 a 1728 firma «Dn Diº Phe de la Torre» (Diego Felipe), también en el bautismo de Catalina Cabrero Marqués que se había leído «D.n P.o G.z de la Torre»; el de Peleas de Arriba en 1764, «Dn Joseph Pardo», y el de El Cubo en 1755-1761, «Joseph Rz Cuenllas». La confirmación de Vicente Martín (Zamora, 1759) se registra con el tipo `confirmation` y como observación, porque las fichas no tienen un evento de confirmación; la página del índice del libro de bautismos de Casaseca, con el tipo `index`.

Pendiente: las carpetas de tatarabuelos quintos (295 imágenes sin registrar), sextos (172), séptimos (48), «Otros familiares» (88) y «Abuelos» (9).

**Undécima sesión (12-11-2026): tatarabuelos quintos completos, con sus hermanos.** Se han leído las 295 fotografías de la carpeta «Tatarabuelos quintos» que no tenían asiento. Las 445 fotografías de la carpeta tienen ya asiento: 301 en [`sources/quintos-fotografias.json`](sources/quintos-fotografias.json), con 272 asientos, y 144 en el registro de la carpeta inicial. De las 233 personas de esa generación, 124 tienen ya transcrito su bautismo, 120 su matrimonio y 128 su fallecimiento o entierro, con las velaciones, las dispensas, los bautismos de necesidad, los testamentos y los herederos que expresan las partidas. Se añaden 71 fichas (1.545 personas en total): hermanos e hijos que nombran las partidas, tíos que fueron padrinos, abuelos que las partidas llaman así y la María de las Heras que el árbol confundía con otra.

Correcciones a los resúmenes familiares por lectura directa:

| Persona | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| Antonio Garrote y Catalina Morales | Matrimonio el 15-09-1712 | 20-03-1712 | El 15 de septiembre son las velaciones, en otra partida. |
| Juan Pérez Martín y Luisa Roncero | Matrimonio en septiembre de 1705 | Marzo de 1705 | La partida, rehecha en 1717, dice que se casaron en marzo y se velaron en septiembre. |
| Manuel Cabrero y Catalina Marqués | Matrimonio el 24-11-1717 | 23-05-1717 | El 24 de noviembre son las velaciones, anotadas al pie. |
| Manuel Carrascal e Inés Trigo | Matrimonio el 16-01-1695 | 05-12-1694 | El 16 de enero son las velaciones, anotadas al margen. |
| Manuel Martín y Catalina Jorge | Matrimonio el 08-05-1707 | 30-03-1707 | El 8 de mayo son las velaciones. |
| Joaquín Sastre Bartolo | Nació el 26-03-1712 | 16-03-1712 | El 26 es el bautismo; la partida dice que nació el 16. |
| José Zurdo Herrero | Nació el 10-09-1699 | 10-09-1698 | El primer asiento de la misma página es «de noventa y ocho». |
| Lucía Herrero Ruiz | Nació el 16-01-1689 | 16-02-1689 | Son los óleos; el mes no se lee, pero la partida está entre otras del 9 y del 28 de febrero. |
| María Vega Salvador | Nació el 03-08-1698 | 25-07-1698 | El 3 de agosto es el bautismo. |
| María Zurdo Alonso | Nació el 14-01-1702 | 08-01-1702 | El 14 es el bautismo. |
| Domingo Garrote Andrés | Falleció el 14-01-1724 | 15-01-1724 | «El día quinze… murió». |
| Emerenciana Pérez Garzón | Falleció el 04-07-1703 | 05-07-1703 | «En cinco días del mes de Julio… murió». |
| Francisco Alonso Pérez | Falleció el 12-03-1689 | 13-03-1689 | «En treze de março falleció»; el 12 es el asiento anterior. |
| Isabel Fernández | Falleció el 08-11-1753 | 07-11-1753 | El 8 es el entierro. |
| Juan Pérez de la Iglesia | Falleció el 01-04-1760 | 02-04-1760 | «En dos de Abril… murió». |
| Juan Pérez Martín | Falleció el 12-04-1711 | 13-04-1711 | «En treze de Abril… murió». |
| Lucía Herrero Ruiz | Falleció el 24-10-1739 | 25-10-1739 | «En veinte y cinco de octubre… murió». |
| Luisa Roncero Hernández | Falleció el 23-03-1711 | 24-03-1711 | «En veinti quatro de Marzo… murió». |
| Manuel Roncero Hernández | Falleció el 19-07-1738 | 20-07-1738, en Zamora | Murió en la ciudad de Zamora; lo enterraron el 21 en Tardobispo. |
| María Calles | Falleció el 07-03-1714 | 08-03-1714 | «En ocho de marzo… murió». |
| María Domínguez Roncero | Falleció el 08-10-1748 | 07-10-1748 | El 8 es el entierro. |
| Miguel Pereruela Tudera | Falleció el 16-01-1719 | 15-01-1719 | El 16 es el entierro. |
| Pedro Ponce Zamora | Falleció el 26-01-1739 | 25-01-1739 | El 26 es el entierro. |
| Teresa Hernández Hernández | Falleció el 15-03-1777 | 16-03-1777 | «En diez y seis de Marzo… murió». |
| Teresa de Olmedo | Falleció el 16-08-1738 | 15-07-1738 | El entierro dice «a diez i seis días del mes de Agosto, digo Julio». |

El árbol no tenía fecha para los matrimonios de Francisco Alonso Pérez y Emerenciana Pérez Garzón (07-05-1663, con dispensa de tercer grado y velados el 27 de noviembre), Juan Martín Hernández y Francisca González (21-01-1697) y Bernardo Hernández y Francisca de la Fuente (febrero de 1707, partida rehecha en 1717 por declaración jurada de los contrayentes y de tres testigos), ni para el bautismo de Juan Martín Hernández (22-11-1683), el de Juana Miguel (16-02-1702) y el de Juan Vega Salvador (07-01-1691: la partida dice «Año de 91» y es del cura de Gáname de fines del siglo XVII), ni para las muertes de Juan Feltrero (entierro el 12-02-1725) y Mariana Ortizo Benito (entierro el 15-01-1750). En 82 personas la fecha de nacimiento era en realidad la del bautismo y se anota así; en Isabel Andrés Barba, Luis Ramos Bambón y Lucía Herrero Ruiz es la de los óleos. El nombre de Teresa Hernández Hernández se amplía con el del bautismo: Teresa Leonor.

**Las dos María de las Heras.** El árbol tenía una sola María de las Heras Coscarón, nacida en Fadón el 8 de septiembre de 1717, hija de José de las Heras y María Coscarón, que era a la vez la madre de Francisco Sastre (1751). Las partidas muestran dos mujeres: María de las Heras Coscarón casó en 1735 con Antonio Feltrero, hermano de Lorenzo, y fue enterrada en 1741 como su mujer, con unos treinta años; la antepasada, mujer de Joaquín Sastre, fue enterrada en 1791 con setenta y seis años, y el bautismo de su hijo Francisco llama a sus padres «… de las Heras y Madalena Amadora», naturales de Malillos. Se separan: la antepasada pasa a llamarse María de las Heras Amador, hija de Magdalena Amador (el nombre del padre no se lee), y María de las Heras Coscarón queda como ficha propia con sus padres, su bautismo, su matrimonio y su entierro. José de las Heras y María Coscarón dejan así la línea directa, aunque sus fotografías siguen en las carpetas donde estaban. El entierro de Lorenzo Feltrero (1738) lo llama «honbre de María de las Eras»: podría ser la antepasada antes de casar con Joaquín Sastre, pero ninguna partida lo dice y no se enlaza.

Personas añadidas a partir de las partidas. Hermanos e hijos con sus dos padres: Antonio Feltrero Calles; Alonso Diego Martín, que casó el mismo día que Antonio Garrote; Francisco, Manuel, José, María y Teresa Hernández de la Fuente; Isabel Zamora García, confirmada con su hermano Francisco; Roque Sastre Rodrigo; Ildefonso Gaspar de Olmedo; Lorenzo Pérez Hernández; Bárbara Pérez Roncero; Agustina y Juan Roncero Herrero; Alonso de Mena Miguel, con su matrimonio de 1744; Mariana Santiago Rodríguez, cuyo bautismo de 1714 estaba archivado como el de su hermana Manuela, que se casó en 1723; Bernardo Ortizo Benito, gemelo de Mariana; Miguel Alonso Salvador, bautizado en 1692, cuya fotografía se archivó con su nombre aunque el antepasado es su hermano Bernardo; Andrés, Ana, Inés y Juan Martín Rodríguez; Alonso, Francisco, Manuela y Ana Garrote de las Heras; Manuela y Diego Martín González; Alonso y Antonia Tuda Fernández; Gabriel Gaitán Rodríguez, muerto párvulo en 1712; Francisco Domínguez Blanco; Lorenzo, Sebastiana y Susana Zurdo Mateo; Antonio, Tomasa y Manuel Hernández Nieto; Josefa Garrote Domínguez; Eugenia de las Heras Pozo, muerta párvula en 1772; Petrona Pereruela Hernández; Pedro Izquierdo Hernández, muerto niño en 1700; Miguel Piorno de Olmedo, y Jacinta Rodríguez Alonso. Solo con el padre: María Martín, hija de Domingo Martín; Francisco Montalvo, hijo de Tomás Montalvo, y Manuel Feltrero Calles (véase la duda sobre María Calles). Solo con la madre, porque la partida no nombra al padre: don Alonso Marqués Portales, canónigo de Zamora, hijo de Luisa Portales; María y Polonia Garrote Diego, hijas de Catalina Diego, e Isabel Blanco Garrote, hija de Teresa Garrote. Se enlazan además con su madre Catalina Martínez Martín (Emerenciana Martín), Francisco Ramos Bambón (Josefa Bambón), Juan Tuda Fernández (Isabel Fernández) y los seis hijos de Francisco Terrón (Isabel Díaz); con su padre, Ana Piorno Garrote (Alonso Piorno), y Alonso Montalvo Ramos, que solo estaba como hermano de Tomás, se enlaza con sus padres, José Montalvo y María Ramos, por una lista de confirmados de Moraleja. Manuel Roncero Hernández, nieto homónimo del antepasado, recibe su nacimiento (14-01-1739) y su bautismo: la fotografía archivada con el nombre del abuelo es la suya.

Supuestos que conviene conocer, porque las partidas dicen el parentesco pero no por qué lado:

- Abuelos que las partidas llaman así: Sebastián de Mena y Catalina Martín, padrinos de su nieto Alonso de Mena (1690), se tienen por padres de Manuel de Mena; Pedro Nieto, padrino de Catalina Nieto, por padre de Juan Nieto; Domingo Garzón, padrino de Emerenciana Pérez Garzón, por padre de Emerenciana Garzón; Diego Marqués y María Nieto, padrinos de Isabel Marqués Herrero (1705), por padres de Manuel Marqués; José Rodríguez, padrino de Mariana Santiago (1714), por padre de Mariana Rodríguez, y Antón Martín, testigo del bautismo de Santiago Martín Bartolo (1694), por padre de Antón Martín. Jerónima San Juan, de Venialbo, la nombra el bautismo de su nieto Santiago Valladolid como mujer de Luis Valladolid.
- Tíos que fueron padrinos o testigos, enlazados como hermanos por el apellido: don Tomás Jambrina, cura y arcipreste de Gema, que casó a su sobrina Manuela Jambrina (hermano de Antonio Jambrina); María Marqués (de Catalina Marqués, madre de Catalina Díez); Miguel Prieto y María Portales (de Ana María Prieto y de Juan Portales); María Rodríguez (de Mariana Rodríguez); Juan Santiago (de Casilda Santiago); Andrea Rodríguez (de Miguel Rodríguez Méndez), y Antonio Díaz, a quien el entierro de Isabel Díaz llama su hermano. Don Pedro Pérez, canónigo de Zamora, es «tío» de Francisco Alonso Pérez (1689) y de su viuda Emerenciana Pérez (1703), y testamentario de Susana Pérez Galán (1700), madre de Francisco: se le tiene por hermano de Susana.

Dudas que quedan en el registro y conviene conocer:

- El bautismo de Juana Miguel (1702) llama a su madre Jacinta Ufano; su matrimonio (1720), Inés de Trigo, difunta. No se enlaza a ninguna como madre.
- Diferencias de nombre que se dejan como están: la mujer de Andrés Román es «María Hernández» en su matrimonio (Inés Hernández Villar); Basilisa Sánchez Martín es «Vadalisa» en su bautismo y «Basilia» en el de su hija; la madre de Jacinta Blanco Chillón es «Jusepa Chillona» en su bautismo, y la madrina, «Jacinta Chillona»; Catalina Díez Marqués es «Antonia Díez» en su entierro (el margen añade «Cathalina»); Mariana Ortizo Benito es «María Ortiga» en el suyo; Sebastiana Hernández Vega es «Sebastiana Fernández» en su entierro, en el de su marido y en la boda de su hija; la mujer de Miguel Pereruela es «María Fernández» en el entierro de él.
- La boda de Manuel Roncero y Lucía Herrero se fecha «dicho día, mes y año», y el asiento siguiente es del 1 de abril de 1708: sería anterior a esa fecha, pero el árbol mantiene el 17 de octubre de 1709.
- El entierro de un Alonso Piorno, «hijo de Antonio Piorno, ya difunto», en Gáname el 12 de mayo de 1705, encaja con Alonso Piorno Zurdo (1687), pero el árbol lo hace padre de los gemelos Andrés y Manuel Piorno Garrote, nacidos en 1708, y en 1737 Catalina Garrote era su viuda. No se aplica.
- Una Ana Hernández fue enterrada en Sanzoles en 1677 sin nombre de marido: si fuera la mujer de Miguel Salvador, Pedro Salvador Hernández (1679) sería hijo de otra mujer. No se aplica.
- María Calles, «muger de Juan Feltrero», murió en Fadón en 1714, pero el entierro de Juan Feltrero (1725) nombra ofrendadera a «su muger María Calles». Manuel Feltrero, testamentario de su padre en 1725, se enlaza solo con él.
- Felipa (1690), hija de Santiago Domínguez y de «Lorenza» Roncero, podría ser hermana de María Domínguez Roncero, cuya madre es Teresa; no se enlaza. El bautismo de una María, hija de Alonso Coscarón y María Diego (Abelón, 1690), podría ser el de María Coscarón, madre de María de las Heras Coscarón.
- Diego Marqués, abuelo de Isabel Marqués (1705), puede ser el Diego Marqués padre de Juan Marqués Nieto; en Morales había entonces un Diego Marqués «el mozo» y otro «el viejo», y no se funden. Sigue abierto si el Juan Marqués padre de Catalina Marqués Portales es Juan Marqués Nieto.
- No se añaden, por falta de nombre: el párvulo de Manuel Hernández Crespo enterrado el día después que su madre, Catalina Nieto; la hija de unos tres años que dejó María de las Heras Coscarón en 1741; los seis hijos de Pedro Ponce Zamora, uno de ellos mujer de Francisco de Silva, y Josefa Montalvo (1704), hija de un Francisco Montalvo que puede ser el tío de Luis Delgado.

Quedan sin enlace, en el registro de la carpeta, cinco bautismos y bodas de homónimos descartados (Ana Alonso Palacios, Gregoria Moreno Esteban, Isabel Andrés Conde, Luis Ramos y Cecilia Martín, y Manuela Prieto Martín, nacida en 1713, que no puede ser la madre de Antonio Porras) y quince partidas de personas que no están en el árbol, entre ellas los padres de la homónima Ángela Macías Franco (Lorenzo Macías de Dios y María Franco Tomé), Cecilia Martín, Domingo Bragado Alonso, Francisco José González García, Francisco Ufano, Isabel Ramos Alonso, Isabel Rodríguez Herradora, Josefa Montalvo, Luisa López Villaseco, Felipa Domínguez y los dos entierros citados en las dudas. Algunas fotografías están archivadas con un nombre que no es el de la partida: «Muerte de José Zurdo Mayordomo» es el entierro de José Zurdo Herrero, viudo de Ana Mateos (1748), y «Manuel Roncero Hernández» es el bautismo del nieto.

Transcripciones completadas con otras tomas de las mismas partidas: el padrino y la firma del bautismo de Catalina Nieto Galán, la firma del de Ana María Salvador, el padre y un testigo del de Inés Trigo Luelmo, el principio de la partida rehecha de Jerónimo Calabaza, el segundo testigo del bautismo de Francisco Hernández Nieto y la firma de su entierro, el padrino de Juan Vega Salvador, dos palabras del bautismo de Luis Gaitán y el texto completo de su entierro, los testigos del matrimonio de Manuel Hernández Crespo y Catalina Nieto, el texto completo del entierro de Manuel Hernández Crespo, el final del de Isabel Rodríguez y una palabra del de Catalina Garrote. La firma del cura de El Cubo entre 1693 y 1711 se lee unas veces «Santiago Martínez» y otras «Santiago Martín»; se deja como se leyó en cada partida.

**Duodécima sesión (13-11-2026): tatarabuelos sextos completos, con sus hermanos.** Se han leído las 172 fotografías de la carpeta «Tatarabuelos sextos» que no tenían asiento; las 325 imágenes de la carpeta tienen ya asiento en [`sources/sextos-fotografias.json`](sources/sextos-fotografias.json) o en el registro de la carpeta inicial. Las partidas añaden 87 transcripciones de bautismo, 37 de matrimonio y 31 de fallecimiento o entierro a fichas que ya existían; de las 308 personas de esa generación, 109 tienen ya transcrito su bautismo, 89 su matrimonio y 113 su fallecimiento o entierro. Se añaden 59 fichas (1.604 personas en total): hermanos, hijos y nietos que nombran las partidas, padres y abuelos que faltaban y tíos que fueron padrinos.

Correcciones a los resúmenes familiares por lectura directa:

| Persona | Antes | Ahora | Motivo |
| --- | --- | --- | --- |
| Ana Bernabé Blanco | Nació el 27-12-1650 | 27-12-1656 | La partida dice «cinquenta y seis», y el asiento siguiente va bajo el encabezamiento «1657». |
| Bartolomé Garrote Gabriel | Nació el 31-08-1658 | 31-08-1653 | La partida es «de dicho año»; la nota de visita que la sigue es del 7 de septiembre de 1653. |
| Lucas Pereruela | Nació el 24-10-1644 | 27-10-1644 | El día se lee «27». |
| Teresa Ruiz Mateo | Nació el 15-05-1666 | 15-03-1666 | «En quince de março de 1666», asentada después entre las de 1669. |
| Francisco González Pérez | Bautismo en septiembre de 1646 | 09-09-1646 | Otra toma de la misma partida lee la fecha completa y la firma. |
| Jerónimo de Luelmo y Teresa Arroyo | Matrimonio el 08-10-1714 | 03-03-1714 | El 8 de octubre son las velaciones, anotadas al pie. |
| Miguel Terrón | Falleció el 27-03-1679 | 26-03-1679 | El 27 es el entierro. |
| Pedro Garrote Gabriel | Falleció el 31-10-1708 | Diciembre de 1698 | El entierro de su viuda, María Blanco (1709), remite a la cláusula del entierro de su marido, asentada el 25-12-1698. El entierro del 31-10-1711 es de otro Pedro Garrote. |

El árbol no tenía fecha para los bautismos de Alonso Sesma (19-02-1655), Juan Roncero (03-09-1657), Micaela Hernández Vaquero (30-03-1647), Magdalena Amador (27-10-1680) y Mariana Rodríguez (28-10-1688), que pasan también al nacimiento con la nota del bautismo. En 73 personas la fecha de nacimiento era en realidad la del bautismo y se anota así; en Bernardo Pérez Gallego, Martín Ortizo Luengo, María Benéitez Manso, María Esteban Martín y María Grande Bambón es la de los óleos. Los nombres se amplían con lo que dan las partidas: Alonso Sesma Ortizo, Ana Elvira de Herrera Jambrina, Juan Roncero de Herrera (con la partícula que el árbol ya usaba en «de Herrera»), Isabel Sampedro Hernández y Teresa María Valencia Celenque.

Personas añadidas a partir de las partidas:

- Hermanos con sus dos padres: Alonso Rodríguez Corralino (1637), hermano mayor de Juan, cuya fotografía se archivó como si fuera la del padre; Bautista, Pedro y María Martín Esteban, que una nota suelta del libro de Sanzoles cuenta como hermanos de Domingo Martín; María Delgado Jurado (1673), hermana de Catalina; María Barrocal Crespo (1665), hermana de Juan; Francisco Montalvo Ramos (1662), hermano de Tomás y Alonso; Jerónimo Luelmo Martín (1663), hermano de Francisca y María, cuya fotografía lleva el nombre del antepasado Jerónimo de Luelmo Pinto; Juan Pérez Galán (1630), hermano de Susana; María Ramos Urueña, hermana de Francisco Ramos, y Francisco Salvador Rodríguez, hermano de Ana María Salvador, los dos por una lista de confirmados de Moraleja.
- Hijos que nombran los testamentos y entierros: Catalina y Agustina Roncero Hernández (Juan Roncero, 1728); Josefa Pérez de la Iglesia (Manuela de la Iglesia, 1737); Domingo, Marcos y María Morales Bernabé (Ana Bernabé, 1715); Miguel Diego Martín (Catalina Martín, 1714); Vicente y María Blanco Sesma (María Sesma, 1727); Manuel y José Garrote Blanco (María Blanco, 1709); Mateo Pérez Santiago (Miguel Pérez Marcos, 1719); Manuel, Vicenta, Josefa, Francisca y Catalina Gonzalo Hernández, hijos de Micaela Hernández Fernández y de su segundo marido, Miguel Gonzalo, que también se añade. Solo con el padre, porque casó dos veces y la partida no dice de qué mujer eran: Atilano, Josefa y Ana Ortizo (Martín Ortizo, 1743) e Isabel Blanco (José Blanco, 1736). Solo con la madre: María, hija «de otro marido» de Catalina Martín, de la que no consta el apellido.
- Martín Ortizo casó dos veces: el entierro de Juana Benito (1711) lo llama su marido, y el de su hija Teresa, muerta párvula en 1714, nombra a su segunda mujer, María Vicente. Se añaden las dos uniones, sin fecha, y a Teresa con su muerte. Teresa Benito Garrote, que ya estaba como hija de Catalina Garrote, se enlaza con su padre, Francisco Benito, por su boda de 1711 con Alonso Gallego.
- Padres y abuelos: María Ortizo, madre de Alonso Sesma; Francisco Herrero y Ana Jambrina, padres de Ana Elvira de Herrera; Juan Hernández, de Pereruela, padre de Domingo Hernández Nogal, y Juan Hernández, de Tardobispo, padre de Micaela Hernández Fernández (la duda «Juan Hernández o Fernández» de los resúmenes era sobre dos hombres distintos); Lorenzo Hernández, abuelo y padrino de Francisco Hernández de Segovia (1656), que llama a su hijo «Lorenzo Hernández el mozo»; Martín Roncero y María de Herrera, padres de Juan Roncero; Pedro Amador y Manuela Mayoral, padres de Magdalena Amador, con los padres de Pedro, José Amador y Catalina Tejedor, vecinos de Bermillo: la fotografía «Pedro Amador y Catalina Tejedor», de la carpeta inicial, es la boda de 1679 de los padres de Magdalena y pasa a la carpeta de los séptimos; María Herrero, madre de Mariana Rodríguez, y Luisa Nieto, madre de Juan Marqués Nieto.
- Margarita García Bragado, media hermana de Bernardo Hernández Bragado: madrina de su bautismo como «su hermana» (1686), y madre del Domingo Franco bautizado en Corrales en 1696, cuyos padrinos fueron Francisco Hernández y María Bragado, «abuelo del bautizado, materno».

Supuestos que conviene conocer:

- Tíos y hermanos enlazados por el apellido, porque la partida dice el parentesco pero no por qué lado: María Bambón, «su tía», madrina de Isabel Montalvo Bambón (1673), como hermana de Isabel Bambón; Francisco Marcos, «su tío», padrino de Manuela Cabeza Marcos (1667), como hermano de Catalina Marcos. Se añaden como hermanos, sin padres, Roque Bernabé (de Ana Bernabé), Silvestre Diego (de Domingo Diego; el nombre se lee con reservas), Alonso Blanco, alcalde jurado de Abelón (de María Blanco Pascual), y Luisa, Domingo y Ana Martín (de Andrés Martín).
- Dos Luisa Nieto en Morales del Vino: la mujer de Diego Marqués, madre de Juan (enero de 1656), y la de Juan Nieto, madre de María (abril de 1657), se tienen por mujeres distintas.
- Los bautismos de Juan Roncero (1657), Magdalena Amador (1680), Mariana Rodríguez (1688) y Micaela Hernández Vaquero (1647) se aplican porque la familia los identificó así y coinciden el nombre, el lugar y, en lo que se lee, los padres; en el de Juan Roncero el cura tachó otros nombres antes de escribir los de los padres, y en el de Mariana solo se leen palabras sueltas.

Dudas que quedan en el registro y conviene conocer:

- El bautismo de Inés de la Iglesia (Sanzoles) solo se ve en el margen; una nota posterior lo fecha el 17 de marzo de 1627, como el árbol, pero el asiento empieza «En quince de…».
- El bautismo de Agustín Valladolid (1684) llama a su madre Emerenciana de San Juan, y el de su hijo Santiago (1710), Jerónima; se conserva Jerónima.
- Los bautismos de Francisco y Pedro Martín Cordero llaman a su padre «Juan Martín», sin más: sigue abierto si es Juan Martín Esteban. Los de Inés Andrés y Martín Ortizo no aclaran si hay una o dos Catalina Luengo en Abelón, ni los de María Madaleno y Pedro Díez, si hay una o dos María Rubio en Casaseca de las Chanas.
- Martín García Cordero y Teresa Delgado de Vergara: sus bautismos llaman a sus madres María Cordera e Ysabel de Bergara, como el árbol; sus matrimonios, María Zamora y María.
- El bautismo de Micaela Hernández Fernández (1688) llama a su padre «Juan Fernández», abreviado, y su boda (1707), Juan Hernández.
- La boda de María Galván (1689) da a sus padres por vecinos de Samir de los Caños; los resúmenes la hacen nacida en Vegalatrave.
- La boda de Luis Martín e Inés Brioso (1701) y su bautismo (1676) llaman a su madre María Nieto, lo que apoya el apellido Nieto frente al «Cordero» del margen de su entierro.
- Sin enlace por falta de datos: Juan Ortijo, testamentario de Inés Ortijo (1704); Sebastián Luengo, yerno de Catalina Martín; Antón Crespo, «tío» y padrino de Miguel Figal (1651); la nieta Josefa Domínguez, heredera de Manuela de la Iglesia; Ana, Isabel y Catalina Martín, que la nota de Sanzoles menciona sin decir cómo; el niño sin nombre de Juan Tuda y Margarita Pereruela enterrado en 1732, y Luis Bambón, padre de una niña confirmada en Moraleja.

Quedan sin enlace, en el registro de la carpeta, siete partidas de homónimos descartados y ocho de personas que no están en el árbol:

- Homónimos: Catalina Marqués (1626, demasiado pronto para la madre de Catalina Díez), Domingo Garrote (1675, que no puede ser el padre de Domingo Garrote Ortijo), Isabel Crespo (1677, que tendría doce años al nacer María Sesma), Luis Ramos (1680; el antepasado es Luis Ramos Bambón), Juan Pérez (de 1700 a 1708, en Morales), el entierro de otro Pedro Garrote (1711) y la confirmación de una Josefa Rodríguez, hija de Domingo Rodríguez y Catalina Urueña, a la que la versión de 2018 de los resúmenes tomaba por la antepasada.
- Personas que no están en el árbol, con la pista que da cada imagen: Juan de las Heras Esteban (Malillos, 1706), en la carpeta quizá por el padre desconocido de María de las Heras Amador, pero tendría nueve años al nacer ella; Ángela de Dios Rubio (Corrales, 1687), quizá la madre de Francisco Macías, padre de Ángela Macías Manzano, cuyo nombre lleva la nieta; Magdalena Conde (Toro, 1657), madre de la homónima descartada Isabel Andrés Conde; María Andrés Carazo (Fresnadillo, 1668), quizá la Mariana Andrés mujer de Miguel Figal, pero con otro nombre de pila; Alonso, hijo de Pedro Ponce (Casaseca, 1610), quizá un antepasado de Francisco Ponce; Teresa Morales Crespo (Fresnadillo, 1672); Catalina García Rodríguez (Moraleja, 1665), y la lista de confirmados de Moraleja archivada como «Baltasar López Urueña».

Transcripciones completadas con otras tomas de las mismas partidas: la fecha y la firma del bautismo de Francisco González Pérez y una frase del matrimonio de Manuel Alonso y Ana María Salvador («pasada por el Sr Provisor deste obispado»). El bautismo de Pedro Avedillo Urueña coincide con la otra toma. La firma del cura de Pereruela en los años 1680 se lee «Pedro Chanarro», también en el bautismo de María Rodríguez Hernández (1680), que se había leído «Pedro Chavarría».

Pendiente: las carpetas de tatarabuelos séptimos (48 imágenes sin registrar), «Otros familiares» (88) y «Abuelos» (9).

## Rama Unzueta de Arrasate

La familia identifica a Cristóbal, nacido en Villardeciervos el 1 de junio de 1746, como padre de Manuel Unzueta e hijo de Francisco Antonio Unzueta Ormacho e Isabel Romero. El documento `Unzueta vascos.docx` amplía la ascendencia de Francisco Antonio; sus nombres, fechas, sangrías y dudas se conservan en [`sources/unzueta-vascos.json`](sources/unzueta-vascos.json). La familia confirma que las fechas junto a los nombres del documento son fechas de nacimiento.

La familia aclara que Pascuala, nacida el 7 de abril de 1723, era hermana de Francisco Antonio y tía de Cristóbal. Su nacimiento se conserva como observación en la ficha de Francisco Antonio.

Se añaden diecinueve personas; la reconstrucción contiene 1115 fichas, 254 apellidos y 89 lugares. Arrasate y Eibar se incorporan al mapa con las coordenadas municipales de AEMET.

### Ampliación con los registros sacramentales vascos (11-11-2026)

La rama se ha contrastado con el índice de registros sacramentales de los archivos diocesanos vascos (Dokuklik), con las genealogías de Leinztarra y con el Portal de Archivos Españoles (PARES). Las consultas, los asientos utilizados con sus códigos de referencia y las dudas se conservan en [`sources/unzueta-registros-vascos.json`](sources/unzueta-registros-vascos.json). El índice vasco da fecha, nombres, apellidos de los padres, libro y folio, pero no la imagen del asiento: por eso estos eventos no llevan transcripción y sus fechas son las del sacramento. La búsqueda admite los comodines `%` y `_`, necesarios por las grafías Unzueta, Unçueta, Uncueta y Unceta, o Zabarte, Çabarte, Çavarte y Savarte.

Se añaden los bautismos de Francisco Antonio (1721), Christobal (1688), su padre Juan (1643), María Cabarte (1651, en la parroquia de San Miguel Arcángel de Garagartza), Juan Baptista Unceta (1623, en Eibar) y María Fuldain (1612); los matrimonios Unceta–Fuldain (09-02-1643), Unzueta–Zabarte (12-06-1672), Fuldain–Egurbide (23-01-1606) y Landaburu–Guinea (17-07-1612), y el segundo matrimonio del padre de Christobal con Josefa Uribarren Zulaica (02-06-1697). Las defunciones de María Zabarte (22-05-1697) y Mari Miguel Landaburu (12-02-1661) se registran con la fecha del índice, que puede ser la del entierro; la de María Zabarte se le atribuye porque su marido volvió a casarse once días después. Los hermanos y medio hermanos documentados se recogen como observaciones en la ficha del antepasado, igual que Pascuala, sin crear fichas nuevas. Garagartza, Bedoña y Udala son anteiglesias de Arrasate: el lugar sigue siendo Arrasate y la parroquia figura en la nota.

La ejecutoria de diciembre de 1799 de la Real Chancillería de Valladolid (Registro de Ejecutorias, caja 3710, 14), consultada en PARES, llama a María Junquera viuda de Cristóbal de Unzueta, vecinos de Villardeciervos, y recoge la demanda que Cristóbal, flebotomiano, presentó en 1794 junto con Pedro Pérez contra Jorge de Besa Polanco por la conducción de aguas de riego. Se añade a María Junquera como cónyuge de Cristóbal y, por indicación de la familia, como madre de Manuel Unzueta. La parte legible del comienzo se transcribe en el fallecimiento de Cristóbal; las imágenes solo se sirven a baja resolución y el resto no se ha leído.

**El padre de Christobal (decisión de la familia, 11-11-2026).** `Unzueta vascos.docx` lo identificaba con Joan Bauptista, bautizado el 13-04-1646; Leinztarra, con su hermano Juan, bautizado el 05-11-1643, y da a Juan Bautista por marido de Antonia Garay Errarte. El índice confirma que hubo dos hermanos casados a la vez y que ambos figuran como «Juan Bautista» en sus matrimonios; el marido de María Zabarte aparece además ocho veces como «Juan», y el de Antonia Garay, nunca. La familia decide seguir a Leinztarra: la ficha pasa a llamarse Juan Uncueta Fuldain, con la grafía de su asiento de bautismo, y su nacimiento y su bautismo pasan al 05-11-1643, con la advertencia de que la fecha es la del bautismo. Conserva el identificador `joan-bauptista-uncueta-fuldain`, y sus padres y abuelos no cambian. Su hermano Juan Bautista queda mencionado en las observaciones.

**La fecha de Mari Miguel Landaburu (decisión de la familia, 11-11-2026).** `Unzueta vascos.docx` le asignaba el bautismo del 20-01-1619, que está a nombre de «María». Una María Landaburu Guinea, mujer de Miguel Ezcurra Arriola, tuvo hijos en 1652 y 1657, mientras Mari Miguel tenía a María Cabarte en 1651: son dos hermanas, y Leinztarra asigna ese bautismo a María. La familia decide retirar la fecha: el nacimiento de Mari Miguel queda sin fecha, en Arrasate, y María figura entre sus hermanos en las observaciones. Su filiación como hija de Joan Landaburu y Anna Guinea se mantiene según el documento; ningún asiento de bautismo la confirma.

**El apellido de Joan Landaburu (decisión de la familia, 11-11-2026).** `Unzueta vascos.docx` lo llamaba Joan Landaburu Guridi. «Guridi» y los padres que le da Leinztarra, Juan Landaburu Sustaeta y María Guridi Arteaga, corresponden al Juan Landaburu casado en 1602 con Catalina Ocharcoaga, que seguía bautizando hijos en Oñati en septiembre de 1612, dos meses después de la boda de Garagartza: son dos hombres. La familia decide retirar el segundo apellido: la ficha pasa a llamarse Joan Landaburu, conserva el identificador `joan-landaburu-guridi` y lleva una observación que lo distingue del homónimo. Esos padres no se añaden.

**María Junquera (indicación de la familia, 11-11-2026).** La ejecutoria de 1799 la llama viuda de Cristóbal Unzueta, sin nombrar a sus hijos. La familia indica que es la madre de Manuel Unzueta y se enlaza como tal; ningún documento consultado lo afirma expresamente.

**Nacimientos y bautismos.** Las fechas del documento coinciden con las de bautismo del índice. Se conservan como nacimientos, según confirmó la familia, y se añaden los bautismos; las fichas de Juan Uncueta y Mari Miguel Landaburu son las dos excepciones descritas arriba.

No se han encontrado padres para las personas más antiguas de la rama. Los libros de Eibar empiezan en 1601 y están parcialmente quemados desde el bombardeo de 1937; los de Udala empiezan en 1628; no hay bautismos Egurbide en Arrasate antes de 1604, y el índice solo recoge los apellidos de los abuelos, no sus nombres. Tampoco constan en el País Vasco el matrimonio ni la defunción de Christobal, ni otro asiento de Ysabela Ormacho Rodríguez, ni el bautismo de Pascuala: la familia salió de Arrasate después de enero de 1721. El Francisco Antonio Unzueta Ormaechea que Leinztarra casa en Gantzaga en 1774 es un homónimo.

Esta ampliación añade una sola ficha, la de María Junquera, y ningún apellido ni lugar nuevos.

### Bautismos de Villardeciervos (12-11-2026)

La familia aporta una hoja de cálculo con los bautismos de Villardeciervos que llevan el apellido Unzueta: 34 como primer apellido (1723-1874) y 33 como segundo (1794-1875). Cada fila da los nombres de pila de los padres, la fecha del bautismo, el tomo y el folio, pero no el texto del asiento. Las filas, su destino y las dudas se conservan en [`sources/unzueta-bautismos-villardeciervos.json`](sources/unzueta-bautismos-villardeciervos.json). Una familia del índice se enlaza solo cuando los nombres de los dos padres y las fechas coinciden con una pareja del árbol sin otra candidata.

- **Pascuala (07-04-1723)**, hija de Cristóbal e Isabel, fue bautizada en Villardeciervos, la misma fecha que la familia daba a la hermana de Francisco Antonio. Se enlaza con sus padres, Christobal Unzueta Zabarte e Ysabela Ormacho Rodríguez, y deja de necesitar el enlace directo de hermandad. La familia ya vivía en Villardeciervos dos años después del bautismo de Francisco Antonio en Arrasate. El índice escribe su segundo apellido «Macho»; se mantiene Ormacho.
- **Cristóbal (01-06-1746)**, hijo de Francisco e Isabel, se llama Cristóbal Unzueta Romero. Como en el resto de la rama, la fecha del nacimiento se conserva y se añade el bautismo del mismo día.
- Se añaden los bautismos de María Unzueta Fernández (27-11-1822), Antonio Unzueta Fernández (12-12-1832, tres días después de su nacimiento), Josefa Unzueta Fernández (09-08-1868) y Teresa Cuesta Unzueta (02-06-1858).
- Se añaden 27 hermanos de antepasados directos, con su bautismo: Isabel (1769), Antonio (1771) y María (1774) Unzueta Junquera, hijos de Cristóbal y María Junquera; Manuel (1791) y Domingo (1800) Unzueta Junquera, hijos de Manuel y Manuela Junquera; Teresa (1824), Pedro (1825), Francisco (1826), Dominga (1828), José (1830), Antonia y Josefa (las dos el 17-08-1835), Manuel (1837) y Domingo (1839) Unzueta Fernández, hijos de Francisco y María Fernández Villar; Antonio (1860), Avelino (1862), Francisco (1865), María (1866) y Cleto (1874) Unzueta Fernández, hijos de Antonio y Dominga Fernández Román, y María (1846), Josefa (1847, con una fecha imposible en el índice: 31 de septiembre), Antonio (1850), José (1852), Josefa (1855), Maximiana (1860), Leandro (1864) y Petra (1866) Cuesta Unzueta, hijos de Lorenzo Cuesta Herrero y María Unzueta Fernández.

**Identidades decididas por la familia (12-11-2026).** Cinco familias del índice nombran a un solo progenitor que coincide con el árbol. La familia decide enlazarlas:

- Francisco y Tomasa (Unzueta Bobillo, 1764 y 1766): el padre es Francisco Antonio Unzueta Ormacho, casado en segundas nupcias con Tomasa Bobillo. Se añaden ella y los dos hijos del índice; véase más abajo la decisión sobre el bautismo de 1766.
- Manuel y Francisca (Unzueta Rodríguez, 1806-1820): el padre es Manuel Unzueta, casado de nuevo tras el último hijo con Manuela Junquera (1800). Se añaden Francisca Rodríguez y Catalina, Dominga, Francisca, María y Bartolomé, medio hermanos de Francisco Unzueta Junquera.
- Francisco Romero e Isabel (1796 y 1802): la madre es Isabel Unzueta Junquera (1769). Se añaden el marido y María y Francisco Romero Unzueta.
- Domingo Magán y María (1794-1814): la madre es María Unzueta Junquera (1774). Se añaden el marido y diez hijos Magán Unzueta. El índice nombra a la madre de Dominga (28-01-1802) Isabel, pero Isabel Unzueta bautizó a un hijo Romero en abril de ese año; y al padre de Antonia (1811) Diego. Las dos se enlazan con Domingo y María, y la variante queda en la nota del bautismo.
- Diego López y Josefa (1864-1875): la madre es Josefa Unzueta Fernández (1835). Se añaden el marido y seis hijos López Unzueta.

Quedan sin enlazar nueve filas sin relación conocida con el árbol: los hijos de Bartolomé (Unzueta Ferreras, 1843 con Juana y 1846 con Francisca), los de José Villar y Felipa (1828-1833) y los hijos de madre sola (José Unzueta Rodríguez, 1851; María Magán Unzueta, 1828; Joaquina Magán Unzueta, 1839; Isidoro Villar Unzueta, 1852). Pueden ser nietos de las familias enlazadas, pero el índice no nombra a los abuelos: el padre de los Unzueta Ferreras podría ser Bartolomé Unzueta Rodríguez (1820), y las madres solas, Francisca Unzueta Rodríguez (1813), María (1794) y Francisca (1797) Magán Unzueta y Teresa Villar Unzueta (1830). La familia decide dejarlas sin enlazar (12-11-2026).

**El padre de Manuel Unzueta (decisión de la familia, 12-11-2026).** La familia identifica el bautismo del 29-11-1766 (tomo 2, folio 88), que el índice da a un Francisco hijo de Francisco y Tomasa, con el de Manuel Unzueta, marido de Manuela Junquera. Manuel pasa a ser hijo de Francisco Antonio Unzueta Ormacho y Tomasa Bobillo, se llama Manuel Unzueta Bobillo y recibe ese bautismo con una nota sobre el nombre del índice. Se retira la ficha `francisco-unzueta-bobillo-1766`; el Francisco de 1764 se mantiene. Cristóbal Unzueta Romero y María Junquera dejan de ser sus padres: Cristóbal es su medio hermano, y él, María Junquera y sus hijos Isabel, Antonio y María Unzueta Junquera pasan a ser parientes colaterales. Esto sustituye la identificación de Cristóbal como padre de Manuel (al principio de «Rama Unzueta de Arrasate») y la indicación del 11-11-2026 sobre María Junquera. Se conservan los identificadores `cristobal-unzueta-padre-de-manuel` y `maria-junquera-mujer-de-cristobal-unzueta` para no romper los enlaces. Los hijos de Manuel y Manuela Junquera, como Manuel Unzueta Junquera, bautizado el 11-04-1791, no cambian.

Se añade un apellido nuevo, Magán, y ningún lugar; el árbol pasa a 1407 fichas.

**Revisión del 11-11-2026.** Se han examinado nueve fotografías más de la carpeta inicial. Las partidas de Catalina Cabrero Marqués, Francisca Méndez, Ana María Salvador y Bernardo Gaspar identifican a las personas por sus padres: se añaden sus transcripciones y bautismos, y se trasladan las imágenes a las carpetas generacionales. La de Catalina distingue su nacimiento el 01-10-1727 del bautismo el 25; en las otras la fecha expresada es solo de bautismo. Se conserva la duda sobre Theresa Olmedo, mencionada como madre en el entierro de Bernardo.

Las imágenes de Isabel de Urueña Alejandro, Alonso Hernández, Andrés Rodríguez Méndez, Antonio Moreno Isidro y Francisco Cabrero Amor permanecen en la carpeta inicial como borradores sin identificación suficiente; el registro de fotografías conserva las transcripciones y las razones. En particular, la madre de Isabel difiere de la nombrada en el matrimonio de la candidata, y el Andrés bautizado en 1678 no puede ser el padre de una hija nacida en 1683.

En la continuación se revisaron las treinta imágenes restantes de la carpeta inicial. Se incorporan bautismos de Manuel Alonso, Inés de Trigo, Isabel Rodríguez Alonso, Jerónimo de Luelmo, José Zurdo, Juan Vega, Francisco Martín Cabrero, Gregoria Moreno, Ángela González y María de Luelmo, además de otra toma de Manuel Hernández Crespo. Sus fechas de nacimiento se mantienen separadas de los bautismos; cuando la fotografía no muestra el año, se conserva como dato incompleto. El bautismo de Francisco Santos Girón Martín se corrige del 10-02-1745 al 10-11-1745 conforme a la partida, que también dice que nació el 2 de noviembre. Las demás imágenes quedan en la carpeta inicial con transcripciones provisionales y sus motivos de duda; el escudo Brioso no identifica a una persona concreta. La fotografía titulada «Pedro Amador y Catalina Tejedor» recoge el matrimonio de Pedro con Manuela, siendo Catalina la madre del contrayente.

Todas las fotografías directamente en «Register Data» han sido examinadas al menos de manera preliminar. Las que permanecen en esa carpeta son lecturas provisionales o imágenes que todavía no permiten una atribución segura; los detalles y puntos ilegibles están en el inventario de fuentes.
