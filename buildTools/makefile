.PHONY: all
.PHONY: build

all: build

build:
	rm -f index.html
	gcc simpleCondense.c
	./a.out ../src/index.html > ./index.html
	rm -f a.out
