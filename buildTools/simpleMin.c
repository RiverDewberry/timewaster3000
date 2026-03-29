#include <stdio.h>

//this is intended to be a simple minification tool for this project only.
//input files are expected to be in the ASCII charset

typedef enum HtmlTokenTypes {
    whitespace = 0, // white space
    symbol = 1, // any character not part of any of the following groups
    tagname = 2, // the name of a tag (for example: p, a, h1, script etc.)
    atributeName = 3, // the name of an atribute (for example src, href etc.)
    atributeValue = 4, // the value of an atribute
    doctype = 5 // it is assumed that there will be a doctype
} HtmlTokenTypes;

char isWhitespace(char ch)
{
    return ch == 0x0A || ch == 0x09 || ch == 0x20;
}

int main(int argc, char ** argv)
{
    if (argc != 2)
    {
        printf("Wrong number of args\n");
        return 0;
    }

    FILE* inputFile = fopen(argv[1], "r");
    fseek(inputFile, 0, SEEK_END);
    size_t inputFileLength = ftell(inputFile);
    fseek(inputFile, 0, SEEK_SET);

    char inputBuffer[inputFileLength + 1];
    fread(inputBuffer, 1, inputFileLength, inputFile);
    inputBuffer[inputFileLength] = 0;

    unsigned char inputBufferTypes[inputFileLength];
    size_t typeIndex = 0;

    printf("%ld %s\n", inputFileLength, inputBuffer);

    return 0;
}
