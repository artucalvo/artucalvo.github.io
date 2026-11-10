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

Cada persona tiene un `id` estable, `name`, `givenNames` y `surnames` como lista explícita. No se admite `source` en las personas ni en la raíz de `records.json`: las fichas y el catálogo no incluyen atribuciones a archivos. La procedencia se conserva únicamente en este README y en los registros internos de `sources/`. Conserva los apellidos compuestos en una sola entrada, por ejemplo `"de las Heras"`. Los identificadores usan letras minúsculas sin tildes, números y guiones. `father` y `mother` hacen referencia a otras personas por su `id`.

La sección «Descendencia» muestra los hijos documentados y enlaza a sus fichas después de «Sus padres». El script genera esas relaciones a partir de `father` y `mother`; no añadas `children`, `parentSummaries` ni `partners` a `records.json`. Las fichas generadas contienen resúmenes con el identificador, nombre, nombres de pila y apellidos de los familiares para mostrar los círculos de navegación sin descargar sus registros completos ni el índice global.

`parentSummaries` identifica los padres conocidos mediante `relation: "father"` o `"mother"`. Cada resumen de `children` incluye también sus referencias `father` y `mother` cuando se conocen. Dos personas con un hijo en común se consideran casadas: si `records.json` no recoge ese matrimonio, el script añade a las fichas generadas de ambas una entrada en `marriages` con el `spouse`, sin fecha ni lugar. No hace falta escribirla a mano; añádela en las dos fichas de `records.json` solo cuando haya una fecha, un lugar u otros datos que registrar. `partners` reúne a los cónyuges de cada persona. La lista `sharedChildren` de cada relación contiene únicamente los identificadores de los hijos que tienen a ambas personas como padres. Un matrimonio no completa un progenitor desconocido a partir de un cónyuge.

Cuando se conocen las fechas de nacimiento y fallecimiento, los años de vida incluyen la edad cumplida al fallecer entre paréntesis, por ejemplo `1948 – 2023 (75 años)`. Si solo se conocen los años o fechas parciales, la diferencia de años aparece como aproximada. No se calcula la edad actual cuando no hay fecha de fallecimiento.

Los eventos opcionales son `birth`, `baptism`, `marriages`, `death` y `burial` (entierro). Una fecha de entierro no se convierte en fecha de fallecimiento. `marriages` es una lista y cada matrimonio puede incluir `spouse`, el identificador del cónyuge, si se conoce. Un evento puede tener `date` en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`, `place`, `note` y `transcription`. Usa la precisión que aporta la fuente. Omite cualquier campo desconocido; no añadas valores vacíos ni fechas estimadas como si fueran exactas. Consulta a la familia antes de cambiar datos contradictorios o identidades dudosas; conserva el valor existente y registra el contraste en el lote correspondiente, sin trasladarlo automáticamente a `note` u `observations`. Los textos de las personas no citan archivos, documentos, fotografías ni versiones. Las notas expresan los hechos y sus límites directamente; solo `observations` puede referirse a «la partida de nacimiento», «la partida de bautismo», «la partida de matrimonio» o «la partida de fallecimiento». Las transcripciones contienen solo texto legible de la partida, con `[ilegible]` para los huecos; las dudas de lectura y los detalles de procedencia se explican en los registros internos.

`origins` recoge lugares asociados a una persona cuando no se conoce el tipo de evento. Se presenta como lugar de referencia, sin atribuirle un nacimiento. Usa el nombre del municipio o localidad en `place` para que el índice de lugares no duplique una población por sus distintas iglesias; guarda el nombre de la iglesia en `note`.

Este repositorio no almacena imágenes de las personas: la cuenta de github.io solo dispone de 1 GB de almacenamiento gratuito y las imágenes de la familia ocupan muchos gigabytes. Por eso las fichas no muestran imágenes y `build-data.mjs` rechaza el campo `documents` en cualquier evento. Una transcripción puede figurar directamente en el evento, en el campo `transcription`.

## Ampliar el árbol

Añade personas y enlaza sus padres mediante identificadores existentes. No hay un límite de generaciones en los datos. La página solicita fichas individuales al navegar y mantiene visible un grupo acotado de familiares, en lugar de cargar y dibujar toda la ascendencia. El catálogo inicial contiene únicamente las ramas y sus personas de partida; el índice de nombres, apellidos y lugares se solicita al abrir el explorador.

El selector muestra entre dos y cuatro generaciones de fichas completas alrededor de la persona activa. Al pulsar una ficha o un círculo familiar, el árbol se centra en esa persona. Los padres conocidos del límite visible y los hijos de la persona activa aparecen como círculos con iniciales. Los cónyuges se muestran junto a la persona activa, con un máximo de dos, y sus padres conocidos también aparecen como círculos. Las conexiones a los hijos se comparten únicamente cuando ambas referencias parentales están documentadas y las dos personas se muestran. Puedes volver a la rama anterior, ampliar o reducir la vista y compartir el enlace a una persona. La memoria caché conserva hasta ochenta fichas. El índice muestra cuarenta resultados por tanda y permite seguir cargando; la búsqueda consulta todo el índice.

La disposición del árbol está en `familia/tree-layout.mjs`, sin dependencias del navegador. Sus comprobaciones recorren todas las personas del archivo y confirman, entre otras cosas, que nada se solapa y que la persona activa queda centrada. Conviene ejecutarlas desde la raíz del repositorio después de añadir datos:

```sh
node --test familia/tree-layout.test.mjs
```

`defaultPerson` fija la persona seleccionada al abrir la página sin un enlace específico. Actualmente es `arturo-calvo-devesa`. `branches` permite definir puntos de entrada con `id`, `label` y una lista `roots` de identificadores. El único punto de partida actual es Arturo. No es necesario crear una rama por generación. Mantén los identificadores existentes para conservar los enlaces a personas.

## Mapa de lugares

La pestaña «Lugares» carga el mapa interactivo cuando se abre. Utiliza Leaflet 1.9.4 y las teselas de OpenStreetMap, con su atribución visible. La biblioteca y su licencia se conservan localmente entre los recursos de la página. Los marcadores y sus agrupaciones permiten explorar las localidades; la búsqueda y la lista de lugares también permiten seleccionar una localidad y encontrar sus personas relacionadas. Si las teselas no están disponibles, la lista sigue siendo utilizable.

`familia/places.json` conserva las coordenadas verificadas y una URL de fuente para cada localidad. El proceso de construcción las incorpora al índice generado; no se geocodifican de nuevo en cada visita. El índice contiene ochenta y cinco referencias de lugar, con coordenadas verificadas para ochenta y cuatro localidades o municipios de España; Galicia se conserva como referencia regional sin marcador, y La Torre del Salinar y Valcamín de Abajo, pueblos que ya no existen, usan por indicación de la familia los puntos de Entrala y de Tardobispo. Las posiciones representan el centro o un punto representativo oficial de cada localidad, sin identificar domicilios. Villardeciervos se sitúa en la provincia de Zamora y Roales corresponde a Roales del Pan (Zamora), según la confirmación de la familia; también existen un Roales en Valderas (León) y Roales de Campos (Valladolid). Los once lugares que añade `TATARABUELOS SEGUNDOS.docx` también están en la provincia de Zamora. Fresnadillo es la localidad de Bermillo de Sayago que `TATARABUELOS TERCEROS.docx` llama Fresnadillo de Sayago; Muga de Alba pertenece a Losacino, y Sogo, a Pereruela. Fuentesaúco es el municipio zamorano, a menos de veinte kilómetros de El Cubo del Vino, y no Fuentesaúco de Fuentidueña (Segovia).

Al añadir un lugar nuevo, la lista sigue funcionando aunque todavía no tenga coordenadas. Comprueba su municipio y provincia antes de incorporarlo al mapa y pregunta a la familia si la localidad no se puede identificar con seguridad. No asignes una posición por aproximación ni conviertas una iglesia citada en las notas en una localidad independiente.

## Alcance y procedencia de los datos

El archivo contiene mil sesenta y cinco personas y hasta catorce generaciones conectadas, con Arturo Calvo Devesa como punto de partida. Las generaciones más lejanas se alcanzan a través de antepasados que aparecen en dos posiciones del árbol, como Francisco Hernández Nieto y Teresa Gaitán Rodríguez, padres de Teodora Hernández Gaitán, o la pareja compartida por Margarita y Fernando Girón Fernández, que aparecen en generaciones distintas. La decimocuarta se alcanza a través de María Carrascal de Trigo, abuela de Jerónima Pérez Luelmo: `TATARABUELOS SEXTOS.docx` la hace hija de Manuel de Carrascal Bragado e Inés de Trigo Luelmo, que ya eran antepasados de Arturo por otra línea. La ficha de Arturo incluye únicamente el nombre, el lugar de nacimiento, Zamora, y los enlaces a sus padres. Sus padres son Bernardo Calvo Brioso y María Ángeles Devesa Herrero. Los datos de estas tres personas proceden de la información aportada por la familia; no se añaden fechas ni otros detalles no facilitados.

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

Las personas repetidas entre documentos comparten una sola ficha. Se conservan los identificadores anteriores de Enrique y Benito, aunque `BISABUELOS.docx` amplía sus nombres a Enrique Brioso de Mena y Benito José de las Heras Rabanal, y el de Ángel, aunque `TATARABUELOS PRIMEROS.docx` amplía su nombre a Ángel Celedonio Prada Girón. Del mismo modo, `TATARABUELOS SEGUNDOS.docx` amplía los nombres de Diego Benito Calvo Salvador, María Juana Morales Valladolid y María Rosa de las Mercedes Hernández Martín sin cambiar sus identificadores; el documento abrevia «Mª Rosa», y se mantiene «María Rosa», como la escribe `TATARABUELOS PRIMEROS.docx`. Por decisión de la familia, Manuel Prada Sebastián pasa a llamarse Manuel de Prada Sebastián, como lo escriben las dos versiones de `TATARABUELOS SEGUNDOS.docx`, y conserva su identificador; su hijo mantiene el nombre de Ángel Celedonio Prada Girón. Los apellidos de Mena y de Prada se conservan como entradas compuestas. Las atribuciones anteriores se conservan en `sources/display-cleanup.json`, separadas de los datos de las personas y de la web.

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

Los lugares entre paréntesis de los sesenta y cuatro padres se indexan con el nombre completo de la localidad: «Casaseca Chanas» y «Casaseca Ch.» como Casaseca de las Chanas, «El Cubo» como El Cubo del Vino y «Pelas de Arriba» como Peleas de Arriba. Manuel Martín de Prada nació en Morales del Vino y Antonia Feltrero Gonzalo en Fadón. El lugar que les atribuía `TATARABUELOS PRIMEROS.docx`, Casaseca de las Chanas y Malillos, coincide con el de su matrimonio o su fallecimiento y deja de figurar como lugar de referencia, igual que el de los demás cuando coincide con su nacimiento.

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

Tirso Romero y Tirso Romero Santiago se reúnen porque coinciden su esposa, María Romero Rodríguez, y sus líneas familiares. Se mantienen pendientes, con fichas separadas, las posibles identidades de Francisco Unzueta y María Fernández con Francisco Unzueta Junquera y María Fernández Villar; de Juan Martínez y Felipa Bobillo con Juan Martínez Santiago y su esposa homónima, y de las dos Dominga Romero Romero, que aparecen con cónyuges distintos. La Francisca Gallego de Valdemerilla se mantiene separada de la homónima ya existente en la rama paterna. Estas posibilidades no se convierten en enlaces ni en observaciones públicas.

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
