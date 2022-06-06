default:
    just --list

build-image:
    docker build -t popcorn-initiative --progress plain .

serve: build-image
    docker run --rm -it popcorn-initiative npm run watch

build: build-image
    docker run --rm -it -v $(pwd)/dist/gen:/app/dist/gen popcorn-initiative npm run build
