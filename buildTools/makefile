.PHONY: all
.PHONY: build

all: build

build:
	rm -f index.html
	gcc simpleCondense.c
	./a.out ../index.html > ./index.html
	rm -f a.out
