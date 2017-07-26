#!/usr/bin/env bash
set -eo pipefail
SHA=`git log -1 --abbrev=7 --format="%h"`
DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
NAME="mmex-server"
ENV_VARS="-e PORT=${PORT} -e DROPBOX_ACCESS_KEY=\"${DROPBOX_ACCESS_KEY}\" -e DROPBOX_FILE_PATH=\"${DROPBOX_FILE_PATH}\" -e USER=${USER} -e PASSWORD=\"${PASSWORD}\""

echo "Building artifact ${SHA} at ${DATE}..."
tar cf ${NAME}.tar package.json Dockerfile *.js

echo "Uploading artifact..."
rsync -ae ssh ${NAME}.tar ${SERVER}:~/${NAME}/

echo "Deploying docker container..."
ssh ${SERVER} bash -c "'
cd ~/${NAME}
tar xf ${NAME}.tar
docker build -t ${NAME} .
docker stop ${NAME}
docker rm ${NAME}
docker run --name ${NAME} --restart unless-stopped -v \"\${PWD}\":/app -w /app -p 80:80 -p 443:443 -e SHA=${SHA} -e DATE=\"${DATE}\" ${ENV_VARS} -d ${NAME}
'"

echo "Done."
