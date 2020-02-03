# TorrentList

Este proyecto es un ligero script para poder realizar un directorio web ordenado de archivos ".torrent", con vista previa de su contenido (para poder revisar bien que te descargarás antes que nada).

## Características

1. Uso de breadcrumbs (barra superior)
2. Navegación en pseudo-directorios
3. Vista previa de la información de los archivos torrent
4. Descarga de los archivos torrent

## TO DO

1. [ ] Búsqueda de archivos (barra superior)
2. [ ] Descarga mediante webtorrent

## Instalación y uso

1. Coloca los archivos torrent, dentro de la carpet files. Puedes utilizar carpetas para ordenarlos.
2. Ejecuta el archivo `./update-files.sh` para actualizar la lista de archivos (files.json).
3. Sube los archivos.

### Acerca del Bencode en Javascript nativo

El código que utilizo para hacer bencode directamente en el lado del cliente es el resultado de copia y "traducir" partes de otros 2 códigos: [bencode_online](https://github.com/Chocobo1/bencode_online) y [node-bencode](https://github.com/themasch/node-bencode).

El primero hace uso del segundo como librería, además de usar typescript y webpack para correr en el navegador. Como mi idea era tener algo sencilo y directo, tomé los códigos de ambos y lo hice funcionar directamente en javascript nativo en el navegador sin necesidad de usar webpack.

