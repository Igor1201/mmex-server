#!/usr/bin/env bash
set -eo pipefail
SHA=`git log -1 --abbrev=7 --format="%h"`
DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
NAME="mmex-server"
ENV_VARS="-e PORT=${PORT} -e DROPBOX_ACCESS_KEY='${DROPBOX_ACCESS_KEY}' -e DROPBOX_FILE_PATH='${DROPBOX_FILE_PATH}'"

echo "Building artifact ${SHA} on ${DATE}..."
tar cf ${NAME}.tar package.json Dockerfile *.js

echo "Uploading artifact..."
rsync -ae ssh ${NAME}.tar ${SERVER}:~/${NAME}/

echo "Deploying docker container..."
ssh ${SERVER} bash -c "'
cd ~/${NAME}
tar xf ${NAME}.tar
docker build -t ${NAME} .
docker stop ${NAME}
docker run --rm --name ${NAME} -v '${PWD}':/usr/src/app -w /usr/src/app -p ${PORT}:${PORT} -e SHA=${SHA} -e DATE='${DATE}' ${ENV_VARS} -d ${NAME}
'" > /dev/null

echo "Done."
