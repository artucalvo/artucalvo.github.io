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

`parentSummaries` identifica los padres conocidos mediante `relation: "father"` o `"mother"`. Cada resumen de `children` incluye también sus referencias `father` y `mother` cuando se conocen. Dos personas con un hijo en común se consideran casadas: si `records.json` no recoge ese matrimonio, el script añade a las fichas generadas de ambas una entrada en `marriages` con el `spouse`, sin fecha ni lugar. No hace falta escribirla a mano; añádela en las dos fichas de `records.json` solo cuando haya una fecha, un lugar u otros datos que registrar. `partners` reúne a los cónyuges de cada persona. La lista `sharedChildren` de cada relación contiene únicamente los identificadores de los hijos que tienen a ambas personas como padres. Un matrimonio no completa un progenitor desconocido a partir de un cónyuge.

Cuando se conocen las fechas de nacimiento y fallecimiento, los años de vida incluyen la edad cumplida al fallecer entre paréntesis, por ejemplo `1948 – 2023 (75 años)`. Si solo se conocen los años o fechas parciales, la diferencia de años aparece como aproximada. No se calcula la edad actual cuando no hay fecha de fallecimiento.

Los eventos opcionales son `birth`, `baptism`, `marriages` y `death`. `marriages` es una lista y cada matrimonio puede incluir `spouse`, el identificador del cónyuge, si se conoce. Un evento puede tener `date` en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`, `place`, `note` y `transcription`. Usa la precisión que aporta la fuente. Omite cualquier campo desconocido; no añadas valores vacíos ni fechas estimadas como si fueran exactas. Registra incertidumbres en `note` o en la lista `observations` de la persona.

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

`familia/places.json` conserva las coordenadas verificadas y una URL de fuente para cada localidad. El proceso de construcción las incorpora al índice generado; no se geocodifican de nuevo en cada visita. Los cuarenta y cinco lugares del índice tienen coordenadas verificadas en España. Las posiciones representan el centro o un punto representativo oficial de cada localidad, sin identificar domicilios. Villardeciervos se sitúa en la provincia de Zamora y Roales corresponde a Roales del Pan (Zamora), según la confirmación de la familia; también existen un Roales en Valderas (León) y Roales de Campos (Valladolid). Los once lugares que añade `TATARABUELOS SEGUNDOS.docx` también están en la provincia de Zamora. Fresnadillo es la localidad de Bermillo de Sayago que `TATARABUELOS TERCEROS.docx` llama Fresnadillo de Sayago; Muga de Alba pertenece a Losacino, y Sogo, a Pereruela. Fuentesaúco es el municipio zamorano, a menos de veinte kilómetros de El Cubo del Vino, y no Fuentesaúco de Fuentidueña (Segovia).

Al añadir un lugar nuevo, la lista sigue funcionando aunque todavía no tenga coordenadas. Comprueba su municipio y provincia antes de incorporarlo al mapa y pregunta a la familia si la localidad no se puede identificar con seguridad. No asignes una posición por aproximación ni conviertas una iglesia citada en las notas en una localidad independiente.

## Alcance y procedencia de los datos

El archivo contiene doscientas cincuenta y una personas y hasta diez generaciones conectadas, con Arturo Calvo Devesa como punto de partida. La profundidad máxima incluye la pareja de antepasados compartida por Margarita y Fernando Girón Fernández, que aparecen en generaciones distintas del árbol. La ficha de Arturo incluye únicamente el nombre, el lugar de nacimiento, Zamora, y los enlaces a sus padres. Sus padres son Bernardo Calvo Brioso y María Ángeles Devesa Herrero. Los datos de estas tres personas proceden de la información aportada por la familia; no se añaden fechas ni otros detalles no facilitados.

Los documentos recibidos pertenecen a la ascendencia de Bernardo Calvo Brioso. No se han atribuido esos antepasados a la rama Devesa Herrero ni se han creado ascendientes maternos de Arturo sin documentación. Los títulos de los documentos se interpretan respecto de Bernardo:

- `PADRES.docx`: sus padres, Nicanor Calvo Piorno y Rosario Brioso de las Heras; abuelos paternos de Arturo.
- `ABUELOS.docx`: sus cuatro abuelos y los nombres de sus progenitores; bisabuelos de Arturo.
- `BISABUELOS.docx`: amplía las ocho fichas de esos progenitores y aporta los nombres de sus dieciséis padres.
- `TATARABUELOS PRIMEROS.docx`: amplía las dieciséis fichas de esos padres y aporta los nombres de sus treinta y dos padres.
- `TATARABUELOS SEGUNDOS.docx`: amplía las treinta y dos fichas de esos padres y aporta los nombres de sus sesenta y cuatro padres.
- `TATARABUELOS TERCEROS.docx`: amplía esas sesenta y cuatro fichas y añade ciento veinte padres identificados sin ambigüedad. Reutiliza dos fichas existentes para los padres de Fernando Girón Fernández; otras seis menciones de padres quedan pendientes de resolver tres identidades repetidas.

Las personas repetidas entre documentos comparten una sola ficha. Se conservan los identificadores anteriores de Enrique y Benito, aunque `BISABUELOS.docx` amplía sus nombres a Enrique Brioso de Mena y Benito José de las Heras Rabanal, y el de Ángel, aunque `TATARABUELOS PRIMEROS.docx` amplía su nombre a Ángel Celedonio Prada Girón. Del mismo modo, `TATARABUELOS SEGUNDOS.docx` amplía los nombres de Diego Benito Calvo Salvador, María Juana Morales Valladolid y María Rosa de las Mercedes Hernández Martín sin cambiar sus identificadores; el documento abrevia «Mª Rosa», y se mantiene «María Rosa», como la escribe `TATARABUELOS PRIMEROS.docx`. Por decisión de la familia, Manuel Prada Sebastián pasa a llamarse Manuel de Prada Sebastián, como lo escriben las dos versiones de `TATARABUELOS SEGUNDOS.docx`, y conserva su identificador; su hijo mantiene el nombre de Ángel Celedonio Prada Girón. Los apellidos de Mena y de Prada se conservan como entradas compuestas. Las personas documentadas incluyen `source`; las tres fichas aportadas directamente por la familia no muestran una atribución documental.

Las fotografías de las partidas de `TATARABUELOS PRIMEROS.docx` se conservan fuera del repositorio. Sirven para comprobar el documento y, por decisión de la familia, también para completarlo: las fichas que toman algún dato de ellas lo indican en `source` como «Fotografías de partidas». Con ellas coinciden los dieciséis nacimientos, los cuatro bautismos, seis de los siete matrimonios y cinco de los once fallecimientos; las demás fechas y los datos añadidos se detallan en los criterios de la transcripción. El nombre de un archivo no basta para identificar a una persona: `Josefa Rabanal Arroyo2.JPG` es la partida de Josefa Rabanal Ibáñez (Arroyo es el cura que firma) y `Muerte de Manuel Martín.JPG` corresponde a un Manuel Martín de Villadepera, marido de Catalina Jorge, enterrado en 1731, y no al padre de Felipa Martín Hernández.

`TATARABUELOS SEGUNDOS.docx` existe en dos versiones. La de la carpeta «Árbol genealógico2», de 2018, contiene todo lo que recoge la versión de 2015 de la carpeta «Tatarabuelos segundos» y añade dos matrimonios, tres fallecimientos y nueve causas de fallecimiento. Ningún dato se contradice, por lo que se transcribe la versión de 2018 y se cita como una sola fuente. Sus fechas todavía no se han comparado con las fotografías de las partidas, que se revisarán más adelante. Hasta entonces, cada «Falleció» se registra como fallecimiento, tal como figura en el documento.

## Criterios de la transcripción

Las parejas Miguel Calvo Méndez–Lucía Piorno Santiago, Bernardo Brioso Pérez–Ángela de las Heras Prada, Nicanor Calvo Martín–Marcelina Méndez Maíllo, Enrique Brioso de Mena–Balbina Pérez Sánchez y Benito José de las Heras Rabanal–Mª. Antonia Prada Carretero se deducen de su agrupación y de las fechas y lugares coincidentes de sus matrimonios. Cuando la fuente solo documenta que dos personas son progenitores, se asume que estuvieron casadas, por decisión de la familia. Ese matrimonio se muestra sin fecha ni lugar, y no se inventan esos detalles.

Se conserva el bautismo de Bernardo Brioso Pérez el **02-06-1918**, tal como aparece en `ABUELOS.docx`, con una observación para comprobarlo. También se conserva el bautismo de Enrique Brioso de Mena el **29-01-1885**, frente al nacimiento el **28-01-1855**, tal como aparece en `BISABUELOS.docx`, y se señala la discrepancia. No se corrigen automáticamente los años ni las expresiones de las causas de fallecimiento: entre ellas, «taber dorsal» e «insuficiencia valvular central» se mantienen según la fuente.

Los lugares entre paréntesis tras los nombres de los antepasados se conservan como `origins` cuando no se conoce el tipo de evento. No se interpretan como lugares de nacimiento. Se elimina el lugar de referencia redundante cuando otra fuente aporta expresamente el nacimiento en ese mismo lugar. Para Josefa Rabanal Ibáñez, `BISABUELOS.docx` indica «Zamora. S. Esteban» y `TATARABUELOS PRIMEROS.docx` lo aclara: nació en Zamora y fue bautizada en la iglesia de S. Esteban. Su nacimiento y su bautismo sustituyen el lugar de referencia y la observación anterior. `TATARABUELOS SEGUNDOS.docx` aclara del mismo modo los lugares de sus padres: José Rabanal Martínez nació en la parroquia de San Torcuato y su fallecimiento figura en «Zamora (San Esteban)», y Manuela Ibáñez Martín nació en Zamora, en la iglesia de S. Lázaro. Esas notas sustituyen las observaciones que conservaban «Zamora, S. Esteban» y «Zamora, S. Lázaro».

No se atribuye lugar a los bautismos de Miguel, Lucía, Nicanor Calvo Martín, Marcelina, Salvador o Vicenta, porque no figura expresamente. El bautismo de Rosario conserva la parroquia citada como una nota, sin inventar una fecha o un lugar independiente. Las iglesias citadas junto a matrimonios o fallecimientos se guardan en `note`, sin inferir entierros. La frase duplicada del matrimonio de Benito se registra una sola vez. Se mantiene la grafía **Mª. Antonia**. Las líneas incompletas de las fuentes se omiten, sin crear campos vacíos.

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
| Matías Ibáñez, padre de Gabriel, MATERNOS 23 | «Matías Ibáñez (Viana)» | Viana do Bolo (Ourense). |
| Agustina Pérez, madre de Gabriel, MATERNOS 23 | «Agustina Pérez (San Pedro de Tráveas)» | San Pedro de Trasverea, Riós (Ourense). |
| Ángela Macías, madre de Pedro Bragado, MATERNOS 31 | «Ángela Macías (Corrales)» | Corrales del Vino (Zamora). |

### Pendientes de confirmación

La familia ha pedido dejar pendientes el fallecimiento de Bernardo y las tres identidades repetidas. Estos datos no se incorporan a los eventos, relaciones ni observaciones personales mientras no se resuelvan. Se mantiene el resto de información inequívoca de las personas afectadas.

| Dato | Valor existente antes del lote | Lectura y contexto de la fuente | Estado |
| --- | --- | --- | --- |
| Fallecimiento de Bernardo Feltrero Esteban | Sin fallecimiento; su hija Antonia Feltrero Gonzalo nació el 12-07-1775 según `TATARABUELOS SEGUNDOS.docx`. | PATERNOS 23, ambas versiones: «Falleció en Fadón el 28-02-1767.» La muerte precedería ocho años al nacimiento de su hija. | Fallecimiento sin incorporar; no se altera el nacimiento de Antonia. |
| Pedro de Prada | No existían fichas ni enlaces para ninguno de los dos padres. | PATERNOS 6: «Pedro de Prada (Morales del Vino) y Luisa Martín (Morales del Vino)», padres de Felipa, nacida en 1750. MATERNOS 25: «Pedro de Prada (Torrefrades) e Inés Delgado (Villamor de Cadozos)», padres de Diego, nacido en 1729. | No se decide si son uno o dos hombres; ambos enlaces paternos quedan pendientes. |
| Catalina Cabrero | No existían fichas ni enlaces para esas madres. | MATERNOS 1: «Baltasar Brioso (Morales del Vino) y Catalina Cabrero (Morales del Vino)», padres de Alonso Vicente, nacido en 1758. MATERNOS 3: «Nicolás Alonso (Moraleja del Vino) y Catalina Cabrero (Morales del Vino)», padres de Bernardo Mariano, nacido en 1761. | No se decide si es una o dos mujeres; ambos enlaces maternos quedan pendientes. |
| Lorenzo Roncero | No existían fichas ni enlaces para esos padres. | MATERNOS 10: «Lorenzo Roncero (Tardobispo) y Dorotea Hernández (Tardobispo)», padres de Joaquina Paula, nacida en 1748. MATERNOS 28: «Lorenzo Roncero (Tardobispo) y Micaela Pérez (Tardobispo)», padres de Francisca, nacida en 1771. | No se decide si es uno o dos hombres; ambos enlaces paternos quedan pendientes. |

No se han añadido transcripciones de partidas que no se hayan facilitado.
