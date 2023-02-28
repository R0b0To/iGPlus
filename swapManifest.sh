#! /bin/bash

cd ./Extension

if [ -e manifest-ff.json ]
then
  mv manifest.json manifest-c.json
  mv manifest-ff.json manifest.json
  printf 'Firefox manifest is active\n\n'

elif [ -e manifest-c.json ]
then
  mv manifest.json manifest-ff.json
  mv manifest-c.json manifest.json
  printf 'Chrome manifest is active\n\n'
fi
