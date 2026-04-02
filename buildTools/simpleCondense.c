#include <stdio.h>
#include <unistd.h>

//this is intended to be a simple tool to condense the project into one file.
//input files are expected to be in the ASCII charset

typedef enum HtmlTokenTypes {
    whitespace = 0, // white space
    symbol = 1, // non-alphanumeric
    alphanum = 2 // alphanumeric
} HtmlTokenTypes;

char isWhitespace(char ch)
{
    return ch == 0x0A || ch == 0x09 || ch == 0x20;
}

char isAlphaNum(char ch)
{
    return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
}

void makeTypebuffer(char *inputBuffer, unsigned char *typeBuffer, size_t length)
{
    for (size_t i = 0; i < length; i++)
    {
        if (isWhitespace(inputBuffer[i])) typeBuffer[i] = whitespace;
        else if (isAlphaNum(inputBuffer[i])) typeBuffer[i] = alphanum;
        else typeBuffer[i] = symbol;
    }
}

void printFile(char *fname)
{
    FILE* inputFile = fopen(fname, "r");
    fseek(inputFile, 0, SEEK_END);
    size_t inputFileLength = ftell(inputFile);
    fseek(inputFile, 0, SEEK_SET);
    char inputBuffer[inputFileLength + 1];
    fread(inputBuffer, 1, inputFileLength, inputFile);
    fclose(inputFile);
    inputBuffer[inputFileLength] = 0;
    
    char prevType = 0;
    char prevTypePrinted = 0;

    for (size_t i = 0; inputBuffer[i] != 0; i++)
    {
        if (isWhitespace(inputBuffer[i])) 
        {
            prevType = whitespace;
            continue;
        }

        if (isAlphaNum(inputBuffer[i]))
        {
            if (prevTypePrinted == alphanum && prevType == whitespace)
                printf(" ");

            prevType = alphanum;
            prevTypePrinted = alphanum;
        } else {
            prevType = symbol;
            prevTypePrinted = symbol;
        }

        printf("%c", inputBuffer[i]);

        if (inputBuffer[i] == '\"')
        {
            do {
                i++;
                printf("%c", inputBuffer[i]);
            } while (inputBuffer[i] != '\"' && inputBuffer[i - 1] != '\\');
        } else if (inputBuffer[i] == '\'')
        {
            do {
                i++;
                printf("%c", inputBuffer[i]);
            } while (inputBuffer[i] != '\'' && inputBuffer[i - 1] != '\\');
        }
    }
}

void printFileBase64(char *fname)
{
    FILE* inputFile = fopen(fname, "r");
    fseek(inputFile, 0, SEEK_END);
    size_t inputFileLength = ftell(inputFile);
    fseek(inputFile, 0, SEEK_SET);
    char inputBuffer[inputFileLength];
    fread(inputBuffer, 1, inputFileLength, inputFile);
    fclose(inputFile);

    for (size_t i = 0; i < inputFileLength; i += 3)
    {
        int chunk = 0, padding = 0;

        for (size_t j = i; j < i + 3; j++)
        {
            if (j < inputFileLength) ((char*)&chunk)[2+i-j] = inputBuffer[j];
            else ((char*)&chunk)[2+i-j] = 0, padding++;
        }

        for (int j = 0; j < 4; j++)
        {
            if (4 - j <= padding)
            {
                printf("=");
                continue;
            }

            char temp = (chunk >> 18) & 0b111111;
            chunk <<= 6;

            if (temp < 26) printf("%c", 'A' + temp);
            else if (temp < 52) printf("%c", 'a' + temp - 26);
            else if (temp < 62) printf("%c", '0' + temp - 52);
            else if (temp == 62) printf("+");
            else if (temp == 63) printf("/");
        }
    }
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

    {
        int j = 0;
        for (int i = 0; argv[1][i] != 0; i++) if (argv[1][i] == '/') j++;
        for (int i = 0; j != 0; i++)
        {
            if (argv[1][i] == '/') j--;
            if (j == 0) argv[1][i] = 0;
        }
        chdir(argv[1]);
    }

    char inputBuffer[inputFileLength + 1];
    fread(inputBuffer, 1, inputFileLength, inputFile);
    fclose(inputFile);
    inputBuffer[inputFileLength] = 0;

    unsigned char inputBufferTypes[inputFileLength];    

    makeTypebuffer(inputBuffer, inputBufferTypes, inputFileLength);

    char outputBuffer[inputFileLength + 1];

    for(size_t i = 0, j = 0, prev = 0, prevOut = 0; i < inputFileLength; i++)
    {
        if (inputBufferTypes[i] == symbol)
        {
            outputBuffer[j] = inputBuffer[i];
            j++;
            prevOut = symbol;
        } else if (inputBufferTypes[i] == alphanum)
        {
            if (prev == whitespace && prevOut == alphanum)
            {
                outputBuffer[j] = 32;
                j++;
            }
            
            outputBuffer[j] = inputBuffer[i];
            j++;
            prevOut = alphanum;
        }

        prev = inputBufferTypes[i];

        if (i + 1 == inputFileLength) outputBuffer[j] = 0;
    }

    for (size_t i = 0; outputBuffer[i] != 0; i++)
    {
        char printCurrent = 0;

        for (int j = 0; j < 12; j++)
        {
            if (outputBuffer[i + j] != "<script src="[j])
            {
                printCurrent = 1;
                break;
            }

            if (j == 11)
            {
                while (outputBuffer[i] != '\"') i++;
                outputBuffer[i] = 0;

                i++;
                int startIndex = i;

                while (outputBuffer[i] != '\"') i++;
                outputBuffer[i] = 0;

                printf("<script>");
                printFile(outputBuffer + startIndex);
                printf("</script");

                do i++; while(outputBuffer[i] != '>');
                do i++; while(outputBuffer[i] != '>');
            }
        }

        for (int j = 0; j < 31; j++)
        {
            if (
                    outputBuffer[i + j] !=
                    "<link rel=\"icon\" type=\"image/x-icon\" href="[j]
               )
            {
                printCurrent = 1;
                break;
            }

            if (j == 11)
            {
                do i++; while(outputBuffer[i] != '\"');
                do i++; while(outputBuffer[i] != '\"');
                do i++; while(outputBuffer[i] != '\"');
                do i++; while(outputBuffer[i] != '\"');
                do i++; while(outputBuffer[i] != '\"');
                outputBuffer[i] = 0;

                i++;
                int startIndex = i;

                while (outputBuffer[i] != '\"') i++;
                outputBuffer[i] = 0;

                printf("<link rel=\"icon\" type=\"image/x-icon\" href=\"data:image/png;base64,");
                printFileBase64(outputBuffer + startIndex);
                printf("\">");

                do i++; while(outputBuffer[i] != '>');
                i++;
            }
        }

        if (printCurrent == 1) printf("%c", outputBuffer[i]);
    }

    return 0;
}
