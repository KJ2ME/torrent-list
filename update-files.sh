#!/bin/bash
cd "$(dirname "$0")" # ir al directorio donde esta este script
tree files/ -J > files.json
